import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    const { status } = body;

    // Validate status
    const validStatuses = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Status must be one of: ${validStatuses.join(', ')}`,
            details: {}
          }
        },
        { status: 400 }
      );
    }

    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        items:purchase_order_items(
          *,
          product:products(name, sku)
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Purchase order not found',
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
            message: 'Failed to update purchase order status',
            details: error
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder
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
