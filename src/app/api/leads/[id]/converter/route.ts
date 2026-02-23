import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { sendPushToRoles } from '@/lib/push';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const bodySchema = z.object({
  nomeProjeto: z.string().min(1),
  valorTotal: z.number().positive().optional(),
  custoMateriais: z.number().min(0).optional(),
  custoMaoObra: z.number().min(0).optional(),
  margemPct: z.number().min(0).optional(),
  qtdChapasMdf: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id: leadId } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { projetos: { select: { id: true } } },
    });
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    const body = await request.json();
    const data = bodySchema.parse(body);
    let valorTotal = data.valorTotal;
    if (valorTotal == null && data.custoMateriais != null && data.custoMaoObra != null && data.margemPct != null) {
      valorTotal = (data.custoMateriais + data.custoMaoObra) * (1 + data.margemPct / 100);
    }
    if (valorTotal == null || valorTotal <= 0) {
      return NextResponse.json(
        { error: 'Informe valor total ou custos + margem para calcular' },
        { status: 400 }
      );
    }
    const valorPendente = new Decimal(valorTotal);
    const projeto = await prisma.$transaction(async (tx) => {
      const p = await tx.projeto.create({
        data: {
          leadId,
          nome: data.nomeProjeto,
          valorTotal: new Decimal(valorTotal!),
          valorEntradaPago: new Decimal(0),
          valorPendente,
          custoMateriais: data.custoMateriais != null ? new Decimal(data.custoMateriais) : null,
          custoMaoObra: data.custoMaoObra != null ? new Decimal(data.custoMaoObra) : null,
          margemPct: data.margemPct != null ? new Decimal(data.margemPct) : null,
          qtdChapasMdf: data.qtdChapasMdf ?? null,
        },
      });
      await tx.lead.update({
        where: { id: leadId },
        data: { status: 'CONTRATO_ASSINADO' },
      });
      await tx.checklistCompras.create({ data: { projetoId: p.id } });
      return p;
    });
    await sendPushToRoles(
      ['COMERCIAL', 'GESTAO', 'ADMIN'],
      {
        title: 'Lead converteu em projeto',
        body: `${lead.nome} virou projeto.`,
        url: `/projetos/${projeto.id}`,
      }
    ).catch(() => {});
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
