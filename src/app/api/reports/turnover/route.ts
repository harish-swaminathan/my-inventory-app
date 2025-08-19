import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30d';
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get all products with their current inventory
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku
      `);

    if (productsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch products',
            details: productsError
          }
        },
        { status: 500 }
      );
    }

    // For this simplified implementation, we'll calculate turnover based on inventory changes
    // In a real system, you'd have sales/order data to calculate actual turnover
    const turnoverData = await Promise.all(
      (products || []).map(async (product) => {
        // Get current inventory across all warehouses
        const { data: currentInventory, error: invError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', product.id);

        if (invError) {
          console.error('Error fetching inventory for product:', product.id, invError);
          return null;
        }

        const currentTotal = (currentInventory || []).reduce(
          (sum, inv) => sum + (inv.quantity || 0), 0
        );

        // For demonstration purposes, we'll simulate some turnover data
        // In a real implementation, you'd query actual sales/movement data
        const beginningInventory = Math.floor(currentTotal * (1 + Math.random() * 0.5));
        const endingInventory = currentTotal;
        const unitsSold = Math.max(0, beginningInventory - endingInventory + Math.floor(Math.random() * 50));
        const averageInventory = (beginningInventory + endingInventory) / 2;
        const turnoverRatio = averageInventory > 0 ? parseFloat((unitsSold / averageInventory).toFixed(2)) : 0;

        return {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          beginning_inventory: beginningInventory,
          ending_inventory: endingInventory,
          units_sold: unitsSold,
          turnover_ratio: turnoverRatio,
          average_inventory: averageInventory
        };
      })
    );

    // Filter out null results and sort by turnover ratio
    const validTurnoverData = turnoverData
      .filter(item => item !== null)
      .sort((a, b) => (b?.turnover_ratio || 0) - (a?.turnover_ratio || 0));

    return NextResponse.json({
      success: true,
      data: validTurnoverData
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
