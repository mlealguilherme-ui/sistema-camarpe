import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import type { CategoriaDespesa, StatusMovimentacaoCaixa } from '@prisma/client';

const updateSchema = z.object({
  valor: z.number().positive().optional(),
  data: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dataVencimento: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  categoria: z.enum(['SALARIO', 'CONTAS_FIXAS', 'FORNECEDORES', 'INVESTIMENTO_EQUIPAMENTO', 'INVESTIMENTO_APLICACAO', 'IMPOSTOS', 'OUTROS']).optional().nullable(),
  descricao: z.string().min(1).optional(),
  referenciaSalario: z.string().optional().nullable(),
  status: z.enum(['PREVISTO', 'PAGO']).optional(),
  projetoId: z.string().optional().nullable(),
});

function parseDate(s: string): Date {
  if (s.length === 10) return new Date(s + 'T12:00:00.000Z');
  return new Date(s);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    const m = await prisma.movimentacaoCaixa.findUnique({
      where: { id },
      include: { projeto: { select: { id: true, nome: true } } },
    });
    if (!m) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({
      id: m.id,
      tipo: m.tipo,
      valor: Number(m.valor),
      data: m.data.toISOString(),
      dataVencimento: m.dataVencimento?.toISOString() ?? null,
      dataPagamento: m.dataPagamento?.toISOString() ?? null,
      categoria: m.categoria,
      descricao: m.descricao,
      referenciaSalario: m.referenciaSalario,
      status: m.status,
      projetoId: m.projetoId,
      projeto: m.projeto,
      createdAt: m.createdAt.toISOString(),
    });
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
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const update: {
      valor?: Decimal;
      data?: Date;
      dataVencimento?: Date | null;
      categoria?: CategoriaDespesa | null;
      descricao?: string;
      referenciaSalario?: string | null;
      status?: StatusMovimentacaoCaixa;
      projetoId?: string | null;
      dataPagamento?: Date | null;
    } = {};

    if (data.valor !== undefined) update.valor = new Decimal(data.valor);
    if (data.data !== undefined) update.data = parseDate(data.data);
    if (data.dataVencimento !== undefined) update.dataVencimento = data.dataVencimento ? parseDate(data.dataVencimento) : null;
    if (data.categoria !== undefined) update.categoria = data.categoria as CategoriaDespesa | null;
    if (data.descricao !== undefined) update.descricao = data.descricao;
    if (data.referenciaSalario !== undefined) update.referenciaSalario = data.referenciaSalario ?? null;
    if (data.status !== undefined) {
      update.status = data.status as StatusMovimentacaoCaixa;
      if (data.status === 'PAGO') update.dataPagamento = new Date();
      else update.dataPagamento = null;
    }
    if (data.projetoId !== undefined) update.projetoId = data.projetoId ?? null;

    const updated = await prisma.movimentacaoCaixa.update({
      where: { id },
      data: update,
      include: { projeto: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      tipo: updated.tipo,
      valor: Number(updated.valor),
      data: updated.data.toISOString(),
      dataVencimento: updated.dataVencimento?.toISOString() ?? null,
      dataPagamento: updated.dataPagamento?.toISOString() ?? null,
      categoria: updated.categoria,
      descricao: updated.descricao,
      referenciaSalario: updated.referenciaSalario,
      status: updated.status,
      projetoId: updated.projetoId,
      projeto: updated.projeto,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    await prisma.movimentacaoCaixa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
