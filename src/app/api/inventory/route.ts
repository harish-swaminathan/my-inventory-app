import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const warehouseId = searchParams.get('warehouse_id');
    const productId = searchParams.get('product_id');

    let query = supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku),
        warehouse:warehouses(name, location)
      `);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: inventory, error } = await query.order('last_updated', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch inventory',
            details: error
          }
        },
        { status: 500 }
      );
    }

    // Calculate available quantity for each item
    const inventoryWithAvailable = inventory?.map(item => ({
      ...item,
      available_quantity: (item.quantity || 0) - (item.reserved_quantity || 0)
    }));

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
