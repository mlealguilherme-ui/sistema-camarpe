import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const bodySchema = z.object({
  chapasCompradas: z.boolean().optional(),
  ferragensCompradas: z.boolean().optional(),
  outrosItens: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const { id: projetoId } = await params;
    const checklist = await prisma.checklistCompras.findUnique({
      where: { projetoId },
    });
    if (!checklist) return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 });
    return NextResponse.json(checklist);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id: projetoId } = await params;
    const body = await request.json();
    const data = bodySchema.parse(body);
    const checklist = await prisma.checklistCompras.upsert({
      where: { projetoId },
      create: {
        projetoId,
        chapasCompradas: data.chapasCompradas ?? false,
        ferragensCompradas: data.ferragensCompradas ?? false,
        outrosItens: data.outrosItens ?? null,
      },
      update: {
        ...(data.chapasCompradas !== undefined && { chapasCompradas: data.chapasCompradas }),
        ...(data.ferragensCompradas !== undefined && { ferragensCompradas: data.ferragensCompradas }),
        ...(data.outrosItens !== undefined && { outrosItens: data.outrosItens }),
      },
    });
    return NextResponse.json(checklist);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
