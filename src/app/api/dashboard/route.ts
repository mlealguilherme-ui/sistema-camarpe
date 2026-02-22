import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import type { StatusLead } from '@prisma/client';

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'COMERCIAL', 'ADMIN']);

    const hoje = new Date();
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const seteDias = new Date(hoje);
    seteDias.setDate(seteDias.getDate() + 7);

    // Executa todas as queries em paralelo para performance
    const [
      leadsGroupStatus,
      leadsGroupOrigem,
      leadsRecentes,
      convertidosCount,
      totalLeads,
      projetosAgg,
      projetosGroupEtapa,
      projetosAvisos,
      pagamentosRecentes,
      alertasEstoque,
    ] = await Promise.all([
      prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['origem'], _count: { _all: true } }),
      prisma.lead.findMany({
        where: { createdAt: { gte: seisMesesAtras } },
        select: { createdAt: true },
      }),
      prisma.lead.count({ where: { projetos: { some: {} } } }),
      prisma.lead.count(),
      prisma.projeto.aggregate({
        _sum: { valorTotal: true, valorPendente: true },
        _count: { _all: true },
      }),
      prisma.projeto.groupBy({ by: ['statusProducao'], _count: { _all: true } }),
      prisma.projeto.findMany({
        where: {
          OR: [
            { dataPagamentoFinalPrevista: { lte: seteDias }, valorPendente: { gt: 0 } },
            { statusProducao: 'AGUARDANDO_ARQUIVOS', createdAt: { lte: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { id: true, nome: true, statusProducao: true, dataPagamentoFinalPrevista: true, valorPendente: true, createdAt: true },
      }),
      prisma.pagamento.findMany({
        where: { data: { gte: seisMesesAtras } },
        select: { valor: true, data: true },
      }),
      prisma.itemEstoqueAlerta.findMany({
        where: { avisoAtivo: true },
        select: { id: true, nome: true, quantidadeMinima: true, quantidadeAtual: true },
      }),
    ]);

    // Monta estruturas de resposta
    const byStatus: Record<StatusLead, number> = { LEAD: 0, ORCAMENTO_ENVIADO: 0, CONTRATO_ASSINADO: 0, PERDIDO: 0 };
    for (const g of leadsGroupStatus) byStatus[g.status] = g._count._all;

    const porOrigem: Record<string, number> = {};
    for (const g of leadsGroupOrigem) porOrigem[g.origem] = g._count._all;

    const porMes: { mes: string; total: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
      porMes.push({ mes: `${d.getMonth() + 1}/${d.getFullYear()}`, total: 0 });
    }
    for (const l of leadsRecentes) {
      const d = new Date(l.createdAt);
      const idx = Math.min(5, Math.max(0, (d.getFullYear() - seisMesesAtras.getFullYear()) * 12 + d.getMonth() - seisMesesAtras.getMonth()));
      porMes[idx].total++;
    }

    const totalFaturado = Number(projetosAgg._sum.valorTotal ?? 0) - Number(projetosAgg._sum.valorPendente ?? 0);
    const totalPendente = Number(projetosAgg._sum.valorPendente ?? 0);

    const porEtapa: Record<string, number> = {};
    for (const g of projetosGroupEtapa) porEtapa[g.statusProducao] = g._count._all;

    const faturamentoPorMes: { mes: string; valor: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
      faturamentoPorMes.push({ mes: `${d.getMonth() + 1}/${d.getFullYear()}`, valor: 0 });
    }
    for (const pag of pagamentosRecentes) {
      if (!pag.data) continue;
      const d = new Date(pag.data);
      const idx = Math.min(5, Math.max(0, (d.getFullYear() - seisMesesAtras.getFullYear()) * 12 + d.getMonth() - seisMesesAtras.getMonth()));
      faturamentoPorMes[idx].valor += Number(pag.valor);
    }

    const avisos: { tipo: string; mensagem: string; link?: string; id?: string }[] = [];
    for (const p of projetosAvisos) {
      if (p.dataPagamentoFinalPrevista && Number(p.valorPendente) > 0) {
        const dataPag = new Date(p.dataPagamentoFinalPrevista);
        avisos.push({
          tipo: dataPag < hoje ? 'pagamento_vencido' : 'pagamento_proximo',
          mensagem: dataPag < hoje ? `Pagamento vencido: ${p.nome}` : `Pagamento previsto em breve: ${p.nome}`,
          link: `/projetos/${p.id}`,
          id: p.id,
        });
      }
      if (p.statusProducao === 'AGUARDANDO_ARQUIVOS') {
        const dias = Math.floor((hoje.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        avisos.push({ tipo: 'projeto_parado', mensagem: `${p.nome} aguardando arquivos há ${dias} dias`, link: `/projetos/${p.id}`, id: p.id });
      }
    }
    for (const a of alertasEstoque) {
      if (a.quantidadeAtual < a.quantidadeMinima) {
        avisos.push({ tipo: 'estoque', mensagem: `Estoque: ${a.nome} abaixo do mínimo (${a.quantidadeAtual}/${a.quantidadeMinima})`, link: '/compras' });
      }
    }

    const taxaConversao = totalLeads > 0 ? (convertidosCount / totalLeads) * 100 : 0;

    return NextResponse.json({
      crm: { porStatus: byStatus, porOrigem, porMes, totalLeads, convertidos: convertidosCount, taxaConversao: Math.round(taxaConversao * 100) / 100 },
      financeiro: { totalFaturado, totalPendente, entreguesComPendencia: projetosAvisos.filter(p => p.statusProducao === 'ENTREGUE' && Number(p.valorPendente) > 0).length, totalProjetos: projetosAgg._count._all, faturamentoPorMes },
      producao: { porEtapa },
      avisos,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
