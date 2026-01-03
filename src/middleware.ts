import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Try to find any session-related cookie
  const session = request.cookies.get('__session')?.value || request.cookies.get('firebase-auth')?.value;

  // If trying to access dashboard without any session cookie, redirect to login
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Optional: Log this for debugging
    console.log("Middleware: No session found, redirecting to login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
