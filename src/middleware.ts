import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We remove the redirect logic to prevent the "Server vs Client" auth conflict.
  // The Dashboard Layout will now handle the security check.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
