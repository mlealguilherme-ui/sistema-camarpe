import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const bodySchema = z.object({
  valor: z.number().positive(),
  tipo: z.enum(['ENTRADA', 'FINAL']),
  data: z.string().datetime().optional(),
  dataVencimento: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  observacao: z.string().optional(),
  linkComprovante: z.string().url().optional().or(z.literal('')),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id: projetoId } = await params;
    const body = await request.json();
    const data = bodySchema.parse(body);
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    const valorDecimal = new Decimal(data.valor);
    const dataPagamento = data.data ? new Date(data.data) : null;
    const dataVenc = data.dataVencimento ? new Date(data.dataVencimento) : null;
    const ehRecebido = dataPagamento != null;
    const { valorEntradaPago, valorPendente } = projeto;
    let novoEntrada = new Decimal(valorEntradaPago);
    let novoPendente = new Decimal(valorPendente);
    if (ehRecebido) {
      if (data.tipo === 'ENTRADA') {
        novoEntrada = novoEntrada.add(valorDecimal);
        novoPendente = novoPendente.sub(valorDecimal);
      } else {
        novoPendente = novoPendente.sub(valorDecimal);
      }
      if (novoPendente.lessThan(0)) {
        return NextResponse.json(
          { error: 'Valor do pagamento excede o valor pendente' },
          { status: 400 }
        );
      }
    }
    const pagamento = await prisma.pagamento.create({
      data: {
        projetoId,
        valor: valorDecimal,
        tipo: data.tipo as 'ENTRADA' | 'FINAL',
        data: dataPagamento,
        dataVencimento: dataVenc,
        observacao: data.observacao ?? null,
        linkComprovante: data.linkComprovante?.trim() || null,
      },
    });
    if (ehRecebido) {
      await prisma.projeto.update({
        where: { id: projetoId },
        data: {
          valorEntradaPago: data.tipo === 'ENTRADA' ? novoEntrada : valorEntradaPago,
          valorPendente: novoPendente,
          ...(data.tipo === 'FINAL' && { dataPagamentoFinalPrevista: null }),
        },
      });
    }
    return NextResponse.json({
      ...pagamento,
      valor: Number(pagamento.valor),
      data: pagamento.data?.toISOString() ?? null,
      dataVencimento: pagamento.dataVencimento?.toISOString() ?? null,
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
