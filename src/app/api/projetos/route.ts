import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import type { StatusProducao } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const createSchema = z.object({
  nome: z.string().min(1),
  leadId: z.string().optional(),
  valorTotal: z.number().positive(),
  custoMateriais: z.number().min(0).optional(),
  custoMaoObra: z.number().min(0).optional(),
  margemPct: z.number().min(0).optional(),
  qtdChapasMdf: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const statusProducao = searchParams.get('statusProducao') as StatusProducao | null;
    const busca = searchParams.get('busca')?.trim() || searchParams.get('search')?.trim() || null;
    const ordenar = searchParams.get('ordenar') || 'atualizado';
    const periodoDe = searchParams.get('periodoDe')?.trim() || null;
    const periodoAte = searchParams.get('periodoAte')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ProjetoWhereInput = {};
    if (statusProducao) where.statusProducao = statusProducao;
    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { lead: { nome: { contains: busca, mode: 'insensitive' } } },
      ];
    }
    if (periodoDe || periodoAte) {
      where.createdAt = {};
      if (periodoDe) where.createdAt.gte = new Date(periodoDe + 'T00:00:00.000Z');
      if (periodoAte) where.createdAt.lte = new Date(periodoAte + 'T23:59:59.999Z');
    }

    const orderBy =
      ordenar === 'nome'
        ? { nome: 'asc' as const }
        : ordenar === 'valor'
          ? { valorTotal: 'desc' as const }
          : { updatedAt: 'desc' as const };

    const [projetos, total] = await prisma.$transaction([
      prisma.projeto.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          lead: { select: { id: true, nome: true, telefone: true } },
          _count: { select: { arquivos: true, pagamentos: true } },
        },
      }),
      prisma.projeto.count({ where }),
    ]);
    const list = projetos.map((p) => ({
      ...p,
      valorTotal: Number(p.valorTotal),
      valorEntradaPago: Number(p.valorEntradaPago),
      valorPendente: Number(p.valorPendente),
      custoMateriais: p.custoMateriais ? Number(p.custoMateriais) : null,
      custoMaoObra: p.custoMaoObra ? Number(p.custoMaoObra) : null,
      margemPct: p.margemPct ? Number(p.margemPct) : null,
    }));
    return NextResponse.json({ data: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const valorPendente = new Decimal(data.valorTotal);
    const projeto = await prisma.$transaction(async (tx) => {
      const p = await tx.projeto.create({
        data: {
          nome: data.nome,
          leadId: data.leadId ?? null,
          valorTotal: new Decimal(data.valorTotal),
          valorEntradaPago: new Decimal(0),
          valorPendente,
          custoMateriais: data.custoMateriais != null ? new Decimal(data.custoMateriais) : null,
          custoMaoObra: data.custoMaoObra != null ? new Decimal(data.custoMaoObra) : null,
          margemPct: data.margemPct != null ? new Decimal(data.margemPct) : null,
          qtdChapasMdf: data.qtdChapasMdf ?? null,
          createdById: session.sub,
        },
      });
      await tx.checklistCompras.create({ data: { projetoId: p.id } });
      return p;
    });
    return NextResponse.json(projeto);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
