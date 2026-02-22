import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import type { StatusLead } from '@prisma/client';

const origemEnum = ['INDICACAO', 'INSTAGRAM', 'ARQUITETO', 'FACEBOOK', 'SITE', 'AMIGO', 'FAMILIAR', 'PARCEIRO'] as const;

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().min(1).optional(),
  origem: z.enum(origemEnum).optional(),
  status: z.enum(['LEAD', 'ORCAMENTO_ENVIADO', 'CONTRATO_ASSINADO', 'PERDIDO']).optional(),
  motivoPerda: z.string().optional(),
  descricaoProjeto: z.string().optional(),
  observacoes: z.string().optional(),
  dataUltimoContato: z.string().optional(),
  linkOrcamento: z.string().url().optional().or(z.literal('')),
  linkProjeto3d: z.string().url().optional().or(z.literal('')),
  endereco: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        projetos: true,
        atividades: { orderBy: { createdAt: 'desc' }, include: { usuario: { select: { nome: true } } } },
      },
    });
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    return NextResponse.json(lead);
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
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);
    if (data.status === 'PERDIDO' && !data.motivoPerda?.trim()) {
      return NextResponse.json(
        { error: 'Motivo da perda é obrigatório quando status é Perdido' },
        { status: 400 }
      );
    }
    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.telefone !== undefined) updateData.telefone = data.telefone;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.origem !== undefined) updateData.origem = data.origem;
    if (data.status !== undefined) updateData.status = data.status as StatusLead;
    if (data.motivoPerda !== undefined) updateData.motivoPerda = data.motivoPerda || null;
    if (data.descricaoProjeto !== undefined) updateData.descricaoProjeto = data.descricaoProjeto?.trim() || null;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
    if (data.dataUltimoContato !== undefined) updateData.dataUltimoContato = data.dataUltimoContato ? new Date(data.dataUltimoContato) : null;
    if (data.linkOrcamento !== undefined) updateData.linkOrcamento = data.linkOrcamento?.trim() || null;
    if (data.linkProjeto3d !== undefined) updateData.linkProjeto3d = data.linkProjeto3d?.trim() || null;
    if (data.endereco !== undefined) updateData.endereco = data.endereco?.trim() || null;

    const leadAntes = data.status ? await prisma.lead.findUnique({ where: { id }, select: { status: true } }) : null;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        projetos: true,
        atividades: { orderBy: { createdAt: 'desc' }, include: { usuario: { select: { nome: true } } } },
      },
    });

    if (data.status && leadAntes && leadAntes.status !== data.status) {
      await prisma.leadAtividade.create({
        data: {
          leadId: id,
          tipo: data.status === 'ORCAMENTO_ENVIADO' ? 'ORCAMENTO_ENVIADO' : 'OBSERVACAO',
          descricao: `Status alterado para ${data.status}`,
          usuarioId: session.sub,
        },
      });
    }
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
