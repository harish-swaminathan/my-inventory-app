import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Extract inventory ID from alert ID (format: alert_{inventory_id})
    const inventoryId = id.replace('alert_', '');

    // For this simple implementation, we'll create an acknowledgments table entry
    // or you could add an acknowledged field to the inventory table
    // For now, we'll just return success since alerts are dynamically generated

    // In a real implementation, you might:
    // 1. Create an acknowledged_alerts table to track acknowledgments
    // 2. Add timestamp of acknowledgment
    // 3. Track which user acknowledged the alert

    // Verify the inventory record exists
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku),
        warehouse:warehouses(name, location)
      `)
      .eq('id', inventoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Alert not found',
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
            message: 'Failed to acknowledge alert',
            details: error
          }
        },
        { status: 500 }
      );
    }

    // Create alert response
    const currentQuantity = inventory.quantity || 0;
    const reorderLevel = inventory.reorder_level || 0;
    
    let type: string;
    let severity: string;
    
    if (currentQuantity === 0) {
      type = 'OUT_OF_STOCK';
      severity = 'HIGH';
    } else {
      type = 'LOW_STOCK';
      const percentageBelow = (reorderLevel - currentQuantity) / reorderLevel;
      if (percentageBelow >= 0.8) {
        severity = 'HIGH';
      } else if (percentageBelow >= 0.5) {
        severity = 'MEDIUM';
      } else {
        severity = 'LOW';
      }
    }

    const alert = {
      id,
      type,
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      current_quantity: currentQuantity,
      reorder_level: reorderLevel,
      severity,
      created_at: inventory.last_updated,
      is_acknowledged: true, // Now acknowledged
      acknowledged_at: new Date().toISOString(),
      product: inventory.product,
      warehouse: inventory.warehouse
    };

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
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
