import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import type { StatusSugestao } from '@prisma/client';

const createSchema = z.object({
  texto: z.string().min(1, 'Descreva a sugestão ou ideia'),
  etapa: z.string().optional(),
  projetoId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StatusSugestao | null;
    const projetoId = searchParams.get('projetoId');

    const isGestaoOuAdmin = session.role === 'GESTAO' || session.role === 'ADMIN';
    const where: { usuarioId?: string; status?: StatusSugestao; projetoId?: string | null } = {};
    if (!isGestaoOuAdmin) where.usuarioId = session.sub!;
    if (status) where.status = status;
    if (projetoId !== undefined && projetoId !== '') where.projetoId = projetoId || null;

    const list = await prisma.sugestaoMelhoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true } },
        projeto: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const sugestao = await prisma.sugestaoMelhoria.create({
      data: {
        texto: data.texto.trim(),
        etapa: data.etapa?.trim() || null,
        projetoId: data.projetoId || null,
        usuarioId: session.sub!,
      },
      include: {
        usuario: { select: { id: true, nome: true } },
        projeto: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(sugestao);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten().fieldErrors?.texto?.[0] ?? 'Dados inválidos' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
