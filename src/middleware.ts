import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isProtectedMethod = request.method !== 'GET';
  const isSpotsRoute = request.nextUrl.pathname.startsWith('/api/spots');

  // Block only non-GET requests without a token
  if (!token && isSpotsRoute && isProtectedMethod) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/spots/:path*'],
};
