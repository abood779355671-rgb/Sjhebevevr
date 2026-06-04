import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tuhfa-super-secret-jwt-key-2024'
);

const PROTECTED_PATHS = ['/dashboard', '/editor'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('tuhfa_token')?.value;
  const token = authHeader?.replace('Bearer ', '') || cookieToken;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('tuhfa_token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*'],
};
