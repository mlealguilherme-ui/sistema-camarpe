import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import type { TipoMovimentacaoCaixa, StatusMovimentacaoCaixa, CategoriaDespesa } from '@prisma/client';

const createSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA']),
  valor: z.number().positive(),
  data: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  dataVencimento: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  categoria: z.enum(['SALARIO', 'CONTAS_FIXAS', 'FORNECEDORES', 'INVESTIMENTO_EQUIPAMENTO', 'INVESTIMENTO_APLICACAO', 'IMPOSTOS', 'OUTROS']).optional().nullable(),
  descricao: z.string().min(1),
  referenciaSalario: z.string().optional().nullable(),
  status: z.enum(['PREVISTO', 'PAGO']).optional(),
  projetoId: z.string().optional().nullable(),
});

function parseDate(s: string): Date {
  if (s.length === 10) return new Date(s + 'T12:00:00.000Z');
  return new Date(s);
}

function isToday(d: Date): boolean {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo') as TipoMovimentacaoCaixa | null;
    const status = searchParams.get('status') as StatusMovimentacaoCaixa | null;
    const contasAPagar = searchParams.get('contasAPagar') === 'true';
    const projetoId = searchParams.get('projetoId');

    const where: { tipo?: TipoMovimentacaoCaixa; status?: StatusMovimentacaoCaixa; data?: { gte: Date; lte: Date }; dataVencimento?: { not: null }; projetoId?: string } = {};
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (projetoId) where.projetoId = projetoId;
    if (contasAPagar) {
      where.tipo = 'SAIDA';
      where.status = 'PREVISTO';
      where.dataVencimento = { not: null };
    }
    if (mes && !projetoId) {
      const [y, m] = mes.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      where.data = { gte: start, lte: end };
    }

    const list = await prisma.movimentacaoCaixa.findMany({
      where,
      orderBy: projetoId ? [{ data: 'desc' }, { createdAt: 'desc' }] : [{ data: 'asc' }, { dataVencimento: 'asc' }, { createdAt: 'asc' }],
      include: { projeto: { select: { id: true, nome: true } } },
    });

    const listJson = list.map((m) => ({
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
    }));

    return NextResponse.json(listJson);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);

    const dataDate = parseDate(data.data);
    const dataVencimento = data.dataVencimento ? parseDate(data.dataVencimento) : null;
    let status = (data.status as StatusMovimentacaoCaixa) ?? 'PREVISTO';
    const categoria = data.tipo === 'SAIDA' ? (data.categoria as CategoriaDespesa | null) ?? null : null;

    if (data.tipo === 'SAIDA' && status === 'PREVISTO' && (isToday(dataDate) || (dataVencimento && isToday(dataVencimento)))) {
      status = 'PAGO';
    }
    const dataPagamento = status === 'PAGO' ? new Date() : null;

    const created = await prisma.movimentacaoCaixa.create({
      data: {
        tipo: data.tipo as TipoMovimentacaoCaixa,
        valor: new Decimal(data.valor),
        data: dataDate,
        dataVencimento,
        categoria,
        descricao: data.descricao,
        referenciaSalario: data.referenciaSalario ?? null,
        status,
        projetoId: data.projetoId ?? null,
        dataPagamento,
      },
      include: { projeto: { select: { id: true, nome: true } } },
    });

    return NextResponse.json({
      id: created.id,
      tipo: created.tipo,
      valor: Number(created.valor),
      data: created.data.toISOString(),
      dataVencimento: created.dataVencimento?.toISOString() ?? null,
      dataPagamento: created.dataPagamento?.toISOString() ?? null,
      categoria: created.categoria,
      descricao: created.descricao,
      referenciaSalario: created.referenciaSalario,
      status: created.status,
      projetoId: created.projetoId,
      projeto: created.projeto,
      createdAt: created.createdAt.toISOString(),
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
