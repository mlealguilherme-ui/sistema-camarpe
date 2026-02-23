import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/esqueci-senha', '/redefinir-senha', '/api/health', '/api/auth/login', '/api/auth/logout', '/api/auth/esqueci-senha', '/api/auth/redefinir-senha'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((p) => pathname === p) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  const token = request.cookies.get('camarpe_token')?.value;
  if (!token && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (!token && !pathname.startsWith('/api/')) {
    const login = new URL('/login', request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
