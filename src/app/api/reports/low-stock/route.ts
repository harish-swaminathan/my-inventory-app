import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get inventory items that are at or below reorder level
    const { data: lowStockItems, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku, category, price),
        warehouse:warehouses(name, location)
      `)
      .filter('quantity', 'lte', 'reorder_level')
      .order('quantity', { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch low stock report',
            details: error
          }
        },
        { status: 500 }
      );
    }

    // Transform data for the report
    const reportData = (lowStockItems || []).map(item => {
      const currentQuantity = item.quantity || 0;
      const reorderLevel = item.reorder_level || 0;
      const reservedQuantity = item.reserved_quantity || 0;
      const availableQuantity = currentQuantity - reservedQuantity;
      
      // Calculate shortage
      const shortage = Math.max(0, reorderLevel - currentQuantity);
      
      // Determine priority based on stock level
      let priority: string;
      if (currentQuantity === 0) {
        priority = 'CRITICAL';
      } else if (currentQuantity < reorderLevel * 0.3) {
        priority = 'HIGH';
      } else if (currentQuantity < reorderLevel * 0.6) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      // Calculate estimated value of shortage
      const productPrice = item.product?.price || 0;
      const shortageValue = shortage * productPrice;

      return {
        id: item.id,
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        product: {
          name: item.product?.name,
          sku: item.product?.sku,
          category: item.product?.category,
          price: productPrice
        },
        warehouse: {
          name: item.warehouse?.name,
          location: item.warehouse?.location
        },
        current_quantity: currentQuantity,
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity,
        reorder_level: reorderLevel,
        shortage,
        shortage_value: parseFloat(shortageValue.toFixed(2)),
        priority,
        last_updated: item.last_updated,
        days_since_update: Math.floor(
          (new Date().getTime() - new Date(item.last_updated).getTime()) / (1000 * 60 * 60 * 24)
        )
      };
    });

    // Group by priority for summary
    const summary = {
      total_items: reportData.length,
      critical_items: reportData.filter(item => item.priority === 'CRITICAL').length,
      high_priority_items: reportData.filter(item => item.priority === 'HIGH').length,
      medium_priority_items: reportData.filter(item => item.priority === 'MEDIUM').length,
      low_priority_items: reportData.filter(item => item.priority === 'LOW').length,
      total_shortage_value: parseFloat(
        reportData.reduce((sum, item) => sum + item.shortage_value, 0).toFixed(2)
      )
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: reportData
      }
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
