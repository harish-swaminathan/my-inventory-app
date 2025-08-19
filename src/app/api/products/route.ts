import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch products',
            details: error
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products
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

    const { name, sku, category, price, description, specifications } = body;

    // Validate required fields
    if (!name || !sku || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, SKU, and category are required',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          sku,
          category,
          price,
          description,
          specifications
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Product SKU already exists',
              details: error
            }
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create product',
            details: error
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
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
