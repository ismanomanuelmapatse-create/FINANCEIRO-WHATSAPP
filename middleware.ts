import { NextRequest, NextResponse } from 'next/server';

// Protege o painel com palavra-passe (HTTP Basic). Sem DASHBOARD_PASSWORD, só abre em desenvolvimento.
export function middleware(req: NextRequest) {
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!pass) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Defina DASHBOARD_PASSWORD no servidor.', { status: 503 });
    }
    return NextResponse.next();
  }
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6));
    const given = decoded.slice(decoded.indexOf(':') + 1);
    if (given === pass) return NextResponse.next();
  }
  return new NextResponse('Autenticação necessária', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Contas"' },
  });
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
