import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    const { quantity, reorder_level } = body;

    const updateData: Record<string, string | number> = {
      last_updated: new Date().toISOString()
    };

    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }

    if (reorder_level !== undefined) {
      updateData.reorder_level = reorder_level;
    }

    const { data: inventory, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        product:products(name, sku),
        warehouse:warehouses(name, location)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Inventory record not found',
              details: {}
            }
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update inventory',
            details: error
          }
        },
        { status: 500 }
      );
    }

    // Calculate available quantity
    const inventoryWithAvailable = {
      ...inventory,
      available_quantity: (inventory.quantity || 0) - (inventory.reserved_quantity || 0)
    };

    return NextResponse.json({
      success: true,
      data: inventoryWithAvailable
    });
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
