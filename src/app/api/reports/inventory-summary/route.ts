import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch products count',
            details: productsError
          }
        },
        { status: 500 }
      );
    }

    // Get inventory data with product information
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(price, category)
      `);

    if (inventoryError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch inventory data',
            details: inventoryError
          }
        },
        { status: 500 }
      );
    }

    // Get warehouses count
    const { count: warehousesCount, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (warehousesError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch warehouses count',
            details: warehousesError
          }
        },
        { status: 500 }
      );
    }

    // Calculate metrics
    let totalStockValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    const categoryData: { [key: string]: { product_count: number; stock_value: number } } = {};

    (inventoryData || []).forEach(item => {
      const quantity = item.quantity || 0;
      const reorderLevel = item.reorder_level || 0;
      const price = item.product?.price || 0;
      const category = item.product?.category || 'Uncategorized';

      // Calculate stock value
      const itemValue = quantity * price;
      totalStockValue += itemValue;

      // Count low stock and out of stock
      if (quantity === 0) {
        outOfStockItems++;
      } else if (quantity <= reorderLevel) {
        lowStockItems++;
      }

      // Group by category
      if (!categoryData[category]) {
        categoryData[category] = { product_count: 0, stock_value: 0 };
      }
      categoryData[category].product_count++;
      categoryData[category].stock_value += itemValue;
    });

    // Convert category data to array
    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      product_count: data.product_count,
      stock_value: data.stock_value
    }));

    const summary = {
      total_products: totalProducts || 0,
      total_stock_value: parseFloat(totalStockValue.toFixed(2)),
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      warehouses: warehousesCount || 0,
      categories
    };

    return NextResponse.json({
      success: true,
      data: summary
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
