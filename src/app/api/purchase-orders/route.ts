import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // First get purchase orders
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (poError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch purchase orders',
            details: poError
          }
        },
        { status: 500 }
      );
    }

    // Get purchase order items for each PO
    const purchaseOrdersWithItems = await Promise.all(
      (purchaseOrders || []).map(async (po) => {
        const { data: items, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select(`
            *,
            product:products(name, sku)
          `)
          .eq('purchase_order_id', po.id);

        if (itemsError) {
          console.error('Error fetching PO items:', itemsError);
          return { ...po, items: [] };
        }

        return { ...po, items: items || [] };
      })
    );

    return NextResponse.json({
      success: true,
      data: purchaseOrdersWithItems
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { supplier_name, expected_date, items } = body;

    // Validate required fields
    if (!supplier_name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Supplier name and items array are required',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Each item must have product_id, quantity, and unit_price',
              details: {}
            }
          },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );

    // Generate PO number
    const po_number = `PO-${Date.now()}`;

    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert([
        {
          po_number,
          supplier_name,
          status: 'PENDING',
          total_amount,
          expected_date: expected_date ? new Date(expected_date).toISOString() : null,
          order_date: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (poError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create purchase order',
            details: poError
          }
        },
        { status: 500 }
      );
    }

    // Create purchase order items
    const itemsToInsert = items.map(item => ({
      purchase_order_id: purchaseOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price
    }));

    const { data: poItems, error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert)
      .select(`
        *,
        product:products(name, sku)
      `);

    if (itemsError) {
      // Rollback: delete the purchase order
      await supabase.from('purchase_orders').delete().eq('id', purchaseOrder.id);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create purchase order items',
            details: itemsError
          }
        },
        { status: 500 }
      );
    }

    const result = {
      ...purchaseOrder,
      items: poItems
    };

    return NextResponse.json({
      success: true,
      data: result
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
