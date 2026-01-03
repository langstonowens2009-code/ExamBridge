import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all dashboard routes to pass to client-side auth
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};