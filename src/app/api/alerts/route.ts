import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get inventory items that are below reorder level (low stock)
    const { data: lowStockItems, error: lowStockError } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku),
        warehouse:warehouses(name, location)
      `)
      .filter('quantity', 'lte', 'reorder_level')
      .order('quantity', { ascending: true });

    if (lowStockError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch alerts',
            details: lowStockError
          }
        },
        { status: 500 }
      );
    }

    // Transform inventory data into alerts format
    const alerts = (lowStockItems || []).map(item => {
      const currentQuantity = item.quantity || 0;
      const reorderLevel = item.reorder_level || 0;
      
      let type: string;
      let severity: string;
      
      if (currentQuantity === 0) {
        type = 'OUT_OF_STOCK';
        severity = 'HIGH';
      } else {
        type = 'LOW_STOCK';
        // Calculate severity based on how far below reorder level
        const percentageBelow = (reorderLevel - currentQuantity) / reorderLevel;
        if (percentageBelow >= 0.8) {
          severity = 'HIGH';
        } else if (percentageBelow >= 0.5) {
          severity = 'MEDIUM';
        } else {
          severity = 'LOW';
        }
      }

      return {
        id: `alert_${item.id}`,
        type,
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        current_quantity: currentQuantity,
        reorder_level: reorderLevel,
        severity,
        created_at: item.last_updated,
        is_acknowledged: false,
        product: item.product,
        warehouse: item.warehouse
      };
    });

    return NextResponse.json({
      success: true,
      data: alerts
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
