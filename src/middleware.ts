import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if the request is for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get the current user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If there's no user session, check for Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please provide a valid Bearer token.',
              details: {}
            }
          },
          { status: 401 }
        )
      }

      // Extract the token from the Authorization header
      const token = authHeader.split(' ')[1]
      
      // Verify the token with Supabase
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token)
      
      if (error || !tokenUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired token.',
              details: error || {}
            }
          },
          { status: 401 }
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match API routes only
     */
    '/api/(.*)',
  ],
}
