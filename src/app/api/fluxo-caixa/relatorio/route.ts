import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    if (!mes) {
      return NextResponse.json({ error: 'Parâmetro mes (YYYY-MM) obrigatório' }, { status: 400 });
    }
    const [y, m] = mes.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const movimentacoes = await prisma.movimentacaoCaixa.findMany({
      where: { data: { gte: start, lte: end } },
      orderBy: [{ data: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, tipo: true, valor: true, status: true, data: true, descricao: true, categoria: true },
    });

    let entradasPrevisto = 0;
    let entradasPago = 0;
    let saidasPrevisto = 0;
    let saidasPago = 0;

    for (const mov of movimentacoes) {
      const v = Number(mov.valor);
      if (mov.tipo === 'ENTRADA') {
        if (mov.status === 'PAGO') entradasPago += v;
        else entradasPrevisto += v;
      } else {
        if (mov.status === 'PAGO') saidasPago += v;
        else saidasPrevisto += v;
      }
    }

    // Entradas dos pagamentos de projetos no mês (já realizados)
    const pagamentos = await prisma.pagamento.findMany({
      where: { data: { gte: start, lte: end } },
      select: { valor: true },
    });
    const entradasProjetos = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0);

    const movimentacoesJson = movimentacoes.map((mov) => ({
      id: mov.id,
      tipo: mov.tipo,
      valor: Number(mov.valor),
      status: mov.status,
      data: mov.data.toISOString(),
      descricao: mov.descricao,
      categoria: mov.categoria,
    }));

    return NextResponse.json({
      mes: `${y}-${String(m).padStart(2, '0')}`,
      entradasPrevisto,
      entradasPago,
      entradasProjetos,
      entradasTotalPrevisto: entradasPrevisto + entradasProjetos,
      entradasTotalRealizado: entradasPago + entradasProjetos,
      saidasPrevisto,
      saidasPago,
      saldoPrevisto: entradasPrevisto + entradasProjetos - saidasPrevisto - saidasPago,
      saldoRealizado: entradasPago + entradasProjetos - saidasPago,
      movimentacoes: movimentacoesJson,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
