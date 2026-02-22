import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import type { StatusProducao } from '@prisma/client';

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  statusProducao: z
    .enum([
      'AGUARDANDO_ARQUIVOS',
      'PARA_CORTE',
      'MONTAGEM',
      'FITAGEM',
      'PAUSADO',
      'INSTALACAO',
      'ENTREGUE',
    ])
    .optional(),
  valorTotal: z.number().positive().optional(),
  valorEntradaPago: z.number().min(0).optional(),
  valorPendente: z.number().min(0).optional(),
  dataPagamentoFinalPrevista: z.string().datetime().optional().nullable(),
  dataEntregaPrevista: z.string().datetime().optional().nullable(),
  dataEntregaReal: z.string().datetime().optional().nullable(),
  dataInicioProducao: z.string().datetime().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  linkOrcamento: z.string().url().optional().nullable().or(z.literal('')),
  linkProjeto3d: z.string().url().optional().nullable().or(z.literal('')),
  custoMateriais: z.number().min(0).optional().nullable(),
  custoMaoObra: z.number().min(0).optional().nullable(),
  margemPct: z.number().min(0).optional().nullable(),
  qtdChapasMdf: z.number().int().min(0).optional().nullable(),
  materiais: z.array(z.object({ descricao: z.string().min(1), quantidade: z.number().int().min(0).optional().nullable() })).optional(),
});

function toJson(projeto: Awaited<ReturnType<typeof prisma.projeto.findUnique>>) {
  if (!projeto) return null;
  return {
    ...projeto,
    valorTotal: Number(projeto.valorTotal),
    valorEntradaPago: Number(projeto.valorEntradaPago),
    valorPendente: Number(projeto.valorPendente),
    custoMateriais: projeto.custoMateriais ? Number(projeto.custoMateriais) : null,
    custoMaoObra: projeto.custoMaoObra ? Number(projeto.custoMaoObra) : null,
    margemPct: projeto.margemPct ? Number(projeto.margemPct) : null,
    dataPagamentoFinalPrevista: projeto.dataPagamentoFinalPrevista?.toISOString() ?? null,
    dataEntregaPrevista: projeto.dataEntregaPrevista?.toISOString() ?? null,
    dataEntregaReal: projeto.dataEntregaReal?.toISOString() ?? null,
    dataInicioProducao: projeto.dataInicioProducao?.toISOString() ?? null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const { id } = await params;
    const projeto = await prisma.projeto.findUnique({
      where: { id },
      include: {
        lead: true,
        pagamentos: true,
        arquivos: true,
        checklistCompras: true,
        materiais: { orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }] },
        createdBy: { select: { id: true, nome: true } },
        updatedBy: { select: { id: true, nome: true } },
        logsStatus: { orderBy: { createdAt: 'desc' }, take: 50, include: { usuario: { select: { nome: true } } } },
      },
    });
    if (!projeto) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    const out = {
      ...toJson(projeto),
      lead: projeto.lead,
      pagamentos: projeto.pagamentos.map((p) => ({
        ...p,
        valor: Number(p.valor),
        data: p.data?.toISOString() ?? null,
        dataVencimento: p.dataVencimento?.toISOString() ?? null,
      })),
      arquivos: projeto.arquivos,
      checklistCompras: projeto.checklistCompras,
      materiais: projeto.materiais,
      createdBy: projeto.createdBy,
      updatedBy: projeto.updatedBy,
      logsStatus: projeto.logsStatus,
    };
    return NextResponse.json(out);
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
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);
    const onlyStatus = Object.keys(data).length === 1 && data.statusProducao != null;
    if (!onlyStatus) requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    else requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);

    const update: Record<string, unknown> = {};
    if (data.nome != null) update.nome = data.nome;
    if (data.statusProducao != null) update.statusProducao = data.statusProducao as StatusProducao;
    if (data.valorTotal != null) update.valorTotal = new Decimal(data.valorTotal);
    if (data.valorEntradaPago != null) update.valorEntradaPago = new Decimal(data.valorEntradaPago);
    if (data.valorPendente != null) update.valorPendente = new Decimal(data.valorPendente);
    if (data.dataPagamentoFinalPrevista !== undefined) {
      update.dataPagamentoFinalPrevista = data.dataPagamentoFinalPrevista ? new Date(data.dataPagamentoFinalPrevista) : null;
    }
    if (data.dataEntregaPrevista !== undefined) {
      update.dataEntregaPrevista = data.dataEntregaPrevista ? new Date(data.dataEntregaPrevista) : null;
    }
    if (data.dataEntregaReal !== undefined) {
      update.dataEntregaReal = data.dataEntregaReal ? new Date(data.dataEntregaReal) : null;
    }
    if (data.dataInicioProducao !== undefined) {
      update.dataInicioProducao = data.dataInicioProducao ? new Date(data.dataInicioProducao) : null;
    }
    if (data.observacoes !== undefined) update.observacoes = data.observacoes ?? null;
    if (data.linkOrcamento !== undefined) update.linkOrcamento = data.linkOrcamento?.trim() || null;
    if (data.linkProjeto3d !== undefined) update.linkProjeto3d = data.linkProjeto3d?.trim() || null;
    if (data.custoMateriais !== undefined) update.custoMateriais = data.custoMateriais != null ? new Decimal(data.custoMateriais) : null;
    if (data.custoMaoObra !== undefined) update.custoMaoObra = data.custoMaoObra != null ? new Decimal(data.custoMaoObra) : null;
    if (data.margemPct !== undefined) update.margemPct = data.margemPct != null ? new Decimal(data.margemPct) : null;
    if (data.qtdChapasMdf !== undefined) update.qtdChapasMdf = data.qtdChapasMdf;
    update.updatedById = session.sub;

    let projetoAntes: { statusProducao: string } | null = null;
    if (data.statusProducao != null) {
      projetoAntes = await prisma.projeto.findUnique({ where: { id }, select: { statusProducao: true } });
    }

    const projeto = await prisma.$transaction(async (tx) => {
      const updated = await tx.projeto.update({
        where: { id },
        data: update as Parameters<typeof tx.projeto.update>[0]['data'],
      });
      if (data.materiais !== undefined) {
        await tx.materialProjeto.deleteMany({ where: { projetoId: id } });
        if (data.materiais.length > 0) {
          await tx.materialProjeto.createMany({
            data: data.materiais.map((m, i) => ({
              projetoId: id,
              descricao: m.descricao.trim(),
              quantidade: m.quantidade ?? null,
              ordem: i,
            })),
          });
        }
      }
      return updated;
    });

    if (data.statusProducao != null && projetoAntes && projetoAntes.statusProducao !== data.statusProducao) {
      await prisma.projetoStatusLog.create({
        data: {
          projetoId: id,
          deStatus: projetoAntes.statusProducao as StatusProducao,
          paraStatus: data.statusProducao as StatusProducao,
          usuarioId: session.sub,
        },
      });
    }

    const projetoComMateriais = await prisma.projeto.findUnique({
      where: { id },
      include: { materiais: { orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }] } },
    });
    const out = toJson(projetoComMateriais ?? projeto);
    return NextResponse.json({ ...out, materiais: projetoComMateriais?.materiais ?? [] });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
