import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch warehouses',
            details: error
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: warehouses
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

    const { name, location, address, is_active = true } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Warehouse name is required',
            details: {}
          }
        },
        { status: 400 }
      );
    }

    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert([
        {
          name,
          location,
          address,
          is_active
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create warehouse',
            details: error
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: warehouse
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
