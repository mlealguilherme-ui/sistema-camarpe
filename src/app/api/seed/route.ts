import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function checkSeedAuth(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;
  const urlSecret = request.nextUrl.searchParams.get('secret');
  const headerSecret = request.headers.get('x-seed-secret');
  return urlSecret === secret || headerSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!checkSeedAuth(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const hash = await bcrypt.hash('camarpe123', 10);
  await prisma.usuario.upsert({
    where: { email: 'comercial@camarpe.com' },
    create: { email: 'comercial@camarpe.com', senhaHash: hash, nome: 'Comercial', role: 'COMERCIAL' },
    update: { nome: 'Comercial' },
  });
  await prisma.usuario.upsert({
    where: { email: 'producao@camarpe.com' },
    create: { email: 'producao@camarpe.com', senhaHash: hash, nome: 'Produção', role: 'PRODUCAO' },
    update: { nome: 'Produção' },
  });
  await prisma.usuario.upsert({
    where: { email: 'gestao@camarpe.com' },
    create: { email: 'gestao@camarpe.com', senhaHash: hash, nome: 'Gestão', role: 'GESTAO' },
    update: { nome: 'Gestão' },
  });
  await prisma.usuario.upsert({
    where: { email: 'admin@camarpe.com' },
    create: { email: 'admin@camarpe.com', senhaHash: hash, nome: 'Administrador', role: 'ADMIN' },
    update: { nome: 'Administrador' },
  });
  return NextResponse.json({ ok: true, message: 'Usuários criados. Login: admin@camarpe.com / camarpe123' });
}

export async function POST(request: NextRequest) {
  if (!checkSeedAuth(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const hash = await bcrypt.hash('camarpe123', 10);
  await prisma.usuario.upsert({
    where: { email: 'comercial@camarpe.com' },
    create: { email: 'comercial@camarpe.com', senhaHash: hash, nome: 'Comercial', role: 'COMERCIAL' },
    update: { nome: 'Comercial' },
  });
  await prisma.usuario.upsert({
    where: { email: 'producao@camarpe.com' },
    create: { email: 'producao@camarpe.com', senhaHash: hash, nome: 'Produção', role: 'PRODUCAO' },
    update: { nome: 'Produção' },
  });
  await prisma.usuario.upsert({
    where: { email: 'gestao@camarpe.com' },
    create: { email: 'gestao@camarpe.com', senhaHash: hash, nome: 'Gestão', role: 'GESTAO' },
    update: { nome: 'Gestão' },
  });
  await prisma.usuario.upsert({
    where: { email: 'admin@camarpe.com' },
    create: { email: 'admin@camarpe.com', senhaHash: hash, nome: 'Administrador', role: 'ADMIN' },
    update: { nome: 'Administrador' },
  });
  return NextResponse.json({ ok: true, message: 'Usuários criados. Login: admin@camarpe.com / camarpe123' });
}
