import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  const isProtectedMethod = method !== 'GET';
  const isSpotsRoute = pathname.startsWith('/api/spots');

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
