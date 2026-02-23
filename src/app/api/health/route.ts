import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check para monitoramento e deploy (ex.: Vercel).
 * Não requer autenticação.
 * GET /api/health → { ok: true } ou 503 se o banco estiver inacessível.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }
}
