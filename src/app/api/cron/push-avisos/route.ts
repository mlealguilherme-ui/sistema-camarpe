import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushToRoles } from '@/lib/push';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em3Dias = new Date(hoje);
  em3Dias.setDate(em3Dias.getDate() + 3);

  const [projetosVencidos, contasFluxo] = await Promise.all([
    prisma.projeto.findMany({
      where: {
        dataPagamentoFinalPrevista: { lt: hoje },
        valorPendente: { gt: 0 },
      },
      select: { nome: true, valorPendente: true, id: true },
    }),
    prisma.movimentacaoCaixa.findMany({
      where: {
        tipo: 'SAIDA',
        status: 'PREVISTO',
        dataVencimento: { not: null },
      },
      select: { descricao: true, valor: true, dataVencimento: true, id: true },
    }),
  ]);

  const contasVencidas: string[] = [];
  const contasAvencer: string[] = [];
  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  for (const c of contasFluxo) {
    const venc = c.dataVencimento ? new Date(c.dataVencimento) : null;
    if (!venc) continue;
    const label = `${c.descricao} – ${fmt(Number(c.valor))}`;
    if (venc < hoje) contasVencidas.push(label);
    else if (venc <= em3Dias) contasAvencer.push(label);
  }

  const partes: string[] = [];
  if (projetosVencidos.length > 0) {
    partes.push(`${projetosVencidos.length} pagamento(s) vencido(s) de projeto`);
  }
  if (contasVencidas.length > 0) {
    partes.push(`${contasVencidas.length} conta(s) vencida(s)`);
  }
  if (contasAvencer.length > 0) {
    partes.push(`${contasAvencer.length} conta(s) a vencer em até 3 dias`);
  }

  if (partes.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nenhum aviso' });
  }

  const body = partes.join('; ');
  await sendPushToRoles(
    ['GESTAO', 'ADMIN'],
    {
      title: 'Avisos do dia – Camarpe',
      body,
      url: '/dashboard',
    }
  ).catch(() => {});

  return NextResponse.json({ ok: true, sent: body });
}
