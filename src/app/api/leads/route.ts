import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import type { OrigemLead, StatusLead } from '@prisma/client';

const origemEnum = ['INDICACAO', 'INSTAGRAM', 'ARQUITETO', 'FACEBOOK', 'SITE', 'AMIGO', 'FAMILIAR', 'PARCEIRO'] as const;

const createSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().min(1),
  origem: z.enum(origemEnum),
  descricaoProjeto: z.string().optional(),
  observacoes: z.string().optional(),
  dataUltimoContato: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  linkOrcamento: z.string().url().optional().or(z.literal('')),
  linkProjeto3d: z.string().url().optional().or(z.literal('')),
  endereco: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StatusLead | null;
    const origem = searchParams.get('origem') as OrigemLead | null;
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const where: { status?: StatusLead; origem?: OrigemLead; OR?: Array<{ nome: { contains: string; mode: 'insensitive' } } | { telefone: { contains: string } }> } } = {};
    if (status) where.status = status;
    if (origem) where.origem = origem;
    if (search.length > 0) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
      ];
    }
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)));
    const leads = await prisma.lead.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { projetos: { select: { id: true, nome: true } } },
    });
    return NextResponse.json(leads);
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
    const lead = await prisma.lead.create({
      data: {
        nome: data.nome,
        email: data.email?.trim() || null,
        telefone: data.telefone,
        origem: data.origem as OrigemLead,
        createdById: session.sub,
        descricaoProjeto: data.descricaoProjeto?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
        dataUltimoContato: data.dataUltimoContato ? new Date(data.dataUltimoContato) : null,
        linkOrcamento: data.linkOrcamento?.trim() || null,
        linkProjeto3d: data.linkProjeto3d?.trim() || null,
        endereco: data.endereco?.trim() || null,
      },
    });
    return NextResponse.json(lead);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
