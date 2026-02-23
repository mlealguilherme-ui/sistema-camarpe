import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import type { OrigemLead, StatusLead } from '@prisma/client';

const ORIGEM: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  ARQUITETO: 'Arquiteto',
  FACEBOOK: 'Facebook',
  SITE: 'Site',
  AMIGO: 'Amigo',
  FAMILIAR: 'Familiar',
  PARCEIRO: 'Parceiro',
};
const STATUS: Record<string, string> = {
  LEAD: 'Lead',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  CONTRATO_ASSINADO: 'Contrato assinado',
  PERDIDO: 'Perdido',
};

function escapeCsv(val: string | null | undefined): string {
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
    const status = searchParams.get('status') as StatusLead | null;
    const origem = searchParams.get('origem') as OrigemLead | null;
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const where: Prisma.LeadWhereInput = {};
    if (status) where.status = status;
    if (origem) where.origem = origem;
    if (search.length > 0) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
      ];
    }
    const leads = await prisma.lead.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { projetos: { select: { nome: true } } },
    });
    const header = 'Nome,E-mail,Telefone,Origem,Status,Motivo perda,Projeto,Criado em,Atualizado em';
    const rows = leads.map((l) =>
      [
        escapeCsv(l.nome),
        escapeCsv(l.email),
        escapeCsv(l.telefone),
        escapeCsv(ORIGEM[l.origem] ?? l.origem),
        escapeCsv(STATUS[l.status] ?? l.status),
        escapeCsv(l.motivoPerda),
        escapeCsv(l.projetos?.length ? l.projetos.map((p) => p.nome).join('; ') : null),
        l.createdAt.toISOString(),
        l.updatedAt.toISOString(),
      ].join(',')
    );
    const csv = [header, ...rows].join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
