import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { product_id, warehouse_id, type, quantity, reference, notes } = body;

    // Validate required fields
    if (!product_id || !warehouse_id || !type || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product ID, warehouse ID, type, and quantity are required',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!['IN', 'OUT'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be either "IN" or "OUT"',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quantity must be positive',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    // Check if inventory record exists
    const { data: existingInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', product_id)
      .eq('warehouse_id', warehouse_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to check inventory',
            details: fetchError
          }
        },
        { status: 500 }
      );
    }

    let newQuantity: number;
    let inventoryResult;

    if (existingInventory) {
      // Update existing inventory
      newQuantity = type === 'IN' 
        ? (existingInventory.quantity || 0) + quantity
        : (existingInventory.quantity || 0) - quantity;

      // Prevent negative inventory for OUT movements
      if (type === 'OUT' && newQuantity < 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Insufficient inventory for OUT movement',
              details: { available: existingInventory.quantity, requested: quantity }
            }
          },
          { status: 400 }
        );
      }

      const { data: updatedInventory, error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .select(`
          *,
          product:products(name, sku),
          warehouse:warehouses(name, location)
        `)
        .single();

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update inventory',
              details: updateError
            }
          },
          { status: 500 }
        );
      }

      inventoryResult = updatedInventory;
    } else {
      // Create new inventory record (only for IN movements)
      if (type === 'OUT') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Cannot perform OUT movement on non-existent inventory',
              details: {}
            }
          },
          { status: 400 }
        );
      }

      const { data: newInventory, error: createError } = await supabase
        .from('inventory')
        .insert([{
          product_id,
          warehouse_id,
          quantity: quantity,
          reserved_quantity: 0,
          reorder_level: 10, // Default reorder level
          last_updated: new Date().toISOString()
        }])
        .select(`
          *,
          product:products(name, sku),
          warehouse:warehouses(name, location)
        `)
        .single();

      if (createError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create inventory record',
              details: createError
            }
          },
          { status: 500 }
        );
      }

      inventoryResult = newInventory;
    }

    // Log the movement (you might want to create a separate movements table)
    // For now, we'll just return the updated inventory

    // Calculate available quantity
    const inventoryWithAvailable = {
      ...inventoryResult,
      available_quantity: (inventoryResult.quantity || 0) - (inventoryResult.reserved_quantity || 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        movement: {
          product_id,
          warehouse_id,
          type,
          quantity,
          reference,
          notes,
          timestamp: new Date().toISOString()
        },
        inventory: inventoryWithAvailable
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error
        }
      },
      { status: 500 }
    );
  }
}
