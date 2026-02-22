import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const createSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const where = q
      ? {
          OR: [
            { nome: { contains: q, mode: 'insensitive' as const } },
            { telefone: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const list = await prisma.contatoUtil.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const created = await prisma.contatoUtil.create({
      data: { nome: data.nome, telefone: data.telefone },
    });
    return NextResponse.json(created);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
