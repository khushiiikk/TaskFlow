import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-dev-only-do-not-use-in-prod';
const key = new TextEncoder().encode(secretKey);

// Define protected and public routes
const protectedRoutes = ['/dashboard', '/projects', '/tasks'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Root path should redirect to dashboard if logged in, or login if not
  if (path === '/') {
    const sessionCookie = request.cookies.get('session')?.value;
    let isAuthenticated = false;
    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
        isAuthenticated = true;
      } catch (e) {}
    }
    
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);

  const sessionCookie = request.cookies.get('session')?.value;
  let session = null;
  
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
      session = payload;
    } catch (error) {
      // invalid token
    }
  }

  // Redirect to login if trying to access protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if trying to access auth route with active session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based authorization for specific API routes or pages could go here
  if (path.startsWith('/api/projects') && request.method === 'POST') {
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
