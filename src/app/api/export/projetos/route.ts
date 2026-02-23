import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import type { StatusProducao } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const STATUS: Record<string, string> = {
  AGUARDANDO_ARQUIVOS: 'Aguardando arquivos',
  PARA_CORTE: 'Para corte',
  MONTAGEM: 'Montagem',
  FITAGEM: 'Fitagem',
  PAUSADO: 'Pausado',
  INSTALACAO: 'Instalação',
  ENTREGUE: 'Entregue',
};

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const statusProducao = searchParams.get('statusProducao') as StatusProducao | null;
    const busca = searchParams.get('busca')?.trim() || searchParams.get('search')?.trim() || null;
    const periodoDe = searchParams.get('periodoDe')?.trim() || null;
    const periodoAte = searchParams.get('periodoAte')?.trim() || null;
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
    const projetos = await prisma.projeto.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { lead: { select: { nome: true, telefone: true } } },
    });
    const header =
      'Nome,Cliente,Telefone,Status produção,Valor total,Entrada paga,Pendente,Data pag. final prev.,Data entrega prev.,Data entrega real,Criado em';
    const rows = projetos.map((p) =>
      [
        escapeCsv(p.nome),
        escapeCsv(p.lead?.nome),
        escapeCsv(p.lead?.telefone),
        escapeCsv(STATUS[p.statusProducao] ?? p.statusProducao),
        Number(p.valorTotal),
        Number(p.valorEntradaPago),
        Number(p.valorPendente),
        p.dataPagamentoFinalPrevista?.toISOString().slice(0, 10) ?? '',
        p.dataEntregaPrevista?.toISOString().slice(0, 10) ?? '',
        p.dataEntregaReal?.toISOString().slice(0, 10) ?? '',
        p.createdAt.toISOString(),
      ].join(',')
    );
    const csv = [header, ...rows].join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="projetos-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
