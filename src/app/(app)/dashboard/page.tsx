import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { StatusLead } from '@prisma/client';
import DashboardClient from './DashboardClient';

async function getDashboardData() {
  const leads = await prisma.lead.findMany({
    select: { status: true, origem: true, createdAt: true, projetos: { select: { id: true } } },
  });
  const byStatus: Record<StatusLead, number> = {
    LEAD: 0,
    ORCAMENTO_ENVIADO: 0,
    CONTRATO_ASSINADO: 0,
    PERDIDO: 0,
  };
  const porOrigem: Record<string, number> = {};
  const hoje = new Date();
  const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const porMes: { mes: string; total: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    porMes.push({ mes: `${d.getMonth() + 1}/${d.getFullYear()}`, total: 0 });
  }
  for (const l of leads) {
    byStatus[l.status]++;
    porOrigem[l.origem] = (porOrigem[l.origem] || 0) + 1;
    const created = new Date(l.createdAt);
    if (created >= seisMesesAtras) {
      const idx = Math.min(5, Math.max(0, (created.getFullYear() - seisMesesAtras.getFullYear()) * 12 + created.getMonth() - seisMesesAtras.getMonth()));
      if (idx >= 0 && idx < 6) porMes[idx].total++;
    }
  }
  const totalLeads = leads.length;
  const convertidos = leads.filter((l) => l.projetos.length > 0).length;
  const taxaConversao = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

  const projetos = await prisma.projeto.findMany({
    select: {
      id: true,
      nome: true,
      valorTotal: true,
      valorEntradaPago: true,
      valorPendente: true,
      statusProducao: true,
      dataPagamentoFinalPrevista: true,
      createdAt: true,
    },
  });
  const totalFaturado = projetos.reduce((acc, p) => acc + Number(p.valorTotal) - Number(p.valorPendente), 0);
  const totalPendente = projetos.reduce((acc, p) => acc + Number(p.valorPendente), 0);
  const entreguesComPendencia = projetos.filter((p) => p.statusProducao === 'ENTREGUE' && Number(p.valorPendente) > 0).length;

  const porEtapa: Record<string, number> = {};
  for (const p of projetos) {
    porEtapa[p.statusProducao] = (porEtapa[p.statusProducao] || 0) + 1;
  }

  const faturamentoPorMes: { mes: string; valor: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    faturamentoPorMes.push({ mes: `${d.getMonth() + 1}/${d.getFullYear()}`, valor: 0 });
  }
  const pagamentos = await prisma.pagamento.findMany({ select: { valor: true, data: true } });
  for (const pag of pagamentos) {
    if (!pag.data) continue;
    const d = new Date(pag.data);
    if (d >= seisMesesAtras) {
      const idx = Math.min(5, Math.max(0, (d.getFullYear() - seisMesesAtras.getFullYear()) * 12 + d.getMonth() - seisMesesAtras.getMonth()));
      if (idx >= 0 && idx < 6) faturamentoPorMes[idx].valor += Number(pag.valor);
    }
  }

  const avisos: { tipo: string; mensagem: string; link?: string; id?: string }[] = [];
  const seteDias = new Date(hoje);
  seteDias.setDate(seteDias.getDate() + 7);
  for (const p of projetos) {
    if (p.dataPagamentoFinalPrevista && Number(p.valorPendente) > 0) {
      const dataPag = new Date(p.dataPagamentoFinalPrevista);
      if (dataPag < hoje) avisos.push({ tipo: 'pagamento_vencido', mensagem: `Pagamento vencido: ${p.nome}`, link: `/projetos/${p.id}`, id: p.id });
      else if (dataPag <= seteDias) avisos.push({ tipo: 'pagamento_proximo', mensagem: `Pagamento previsto em breve: ${p.nome}`, link: `/projetos/${p.id}`, id: p.id });
    }
    if (p.statusProducao === 'AGUARDANDO_ARQUIVOS') {
      const dias = Math.floor((hoje.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (dias >= 7) avisos.push({ tipo: 'projeto_parado', mensagem: `${p.nome} aguardando arquivos há ${dias} dias`, link: `/projetos/${p.id}`, id: p.id });
    }
  }
  const alertasEstoque = await prisma.itemEstoqueAlerta.findMany({
    where: { avisoAtivo: true },
    select: { nome: true, quantidadeMinima: true, quantidadeAtual: true },
  });
  for (const a of alertasEstoque) {
    if (a.quantidadeAtual < a.quantidadeMinima) avisos.push({ tipo: 'estoque', mensagem: `Estoque: ${a.nome} abaixo do mínimo (${a.quantidadeAtual}/${a.quantidadeMinima})`, link: '/compras' });
  }

  // Avisos: orçamento enviado há mais de 5 dias sem retorno
  const cincoDiasAtras = new Date(hoje);
  cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);
  const leadsOrcamento = await prisma.lead.findMany({
    where: { status: 'ORCAMENTO_ENVIADO', projetos: { none: {} } },
    select: { id: true, nome: true, createdAt: true },
  });
  const leadIds = leadsOrcamento.map((l) => l.id);
  const ultimasAtividades = leadIds.length
    ? await (prisma as unknown as { leadAtividade: { findMany: (args: object) => Promise<{ leadId: string; createdAt: Date }[]> } }).leadAtividade.findMany({
        where: { leadId: { in: leadIds } },
        orderBy: { createdAt: 'desc' },
        select: { leadId: true, createdAt: true },
      })
    : [];
  const ultimaPorLead = new Map<string, Date>();
  for (const a of ultimasAtividades) {
    if (!ultimaPorLead.has(a.leadId)) ultimaPorLead.set(a.leadId, a.createdAt);
  }
  for (const lead of leadsOrcamento) {
    const ultimaAtividade = ultimaPorLead.get(lead.id) ?? lead.createdAt;
    if (new Date(ultimaAtividade) < cincoDiasAtras) {
      avisos.push({
        tipo: 'orcamento_sem_retorno',
        mensagem: `Orçamento enviado há mais de 5 dias sem retorno: ${lead.nome}`,
        link: `/leads/${lead.id}`,
        id: lead.id,
      });
    }
  }

  // Avisos: contas a pagar (fluxo de caixa) vencidas ou a vencer em 7 dias
  const contasFluxo = await (prisma as unknown as { movimentacaoCaixa: { findMany: (args: object) => Promise<{ id: string; descricao: string; valor: unknown; dataVencimento: Date | null }[]> } }).movimentacaoCaixa.findMany({
    where: { tipo: 'SAIDA', status: 'PREVISTO', dataVencimento: { not: null } },
    select: { id: true, descricao: true, valor: true, dataVencimento: true },
  });
  for (const c of contasFluxo) {
    const venc = c.dataVencimento ? new Date(c.dataVencimento) : null;
    if (!venc) continue;
    if (venc < hoje) {
      avisos.push({ tipo: 'conta_vencida', mensagem: `Conta vencida: ${c.descricao}`, link: '/fluxo-caixa', id: c.id });
    } else if (venc <= seteDias) {
      avisos.push({ tipo: 'conta_proximo', mensagem: `Conta a vencer: ${c.descricao} (${venc.toLocaleDateString('pt-BR')})`, link: '/fluxo-caixa', id: c.id });
    }
  }

  // Projetos em produção (excluindo ENTREGUE) para visão rápida
  const projetosEmProducaoRaw = await prisma.projeto.findMany({
    where: { statusProducao: { not: 'ENTREGUE' } },
    orderBy: [{ statusProducao: 'asc' }, { updatedAt: 'desc' }],
    include: { lead: { select: { nome: true } } },
  });

  const projetosEmProducao = projetosEmProducaoRaw.map((p) => {
    const dataEntrega = 'dataEntregaPrevista' in p ? (p as { dataEntregaPrevista?: Date | null }).dataEntregaPrevista : null;
    return {
      id: p.id,
      nome: p.nome,
      statusProducao: p.statusProducao,
      valorPendente: Number(p.valorPendente),
      dataEntregaPrevista: dataEntrega ? dataEntrega.toISOString() : null,
      cliente: p.lead?.nome ?? null,
    };
  });

  return {
    crm: { porStatus: byStatus, porOrigem, porMes, totalLeads, convertidos, taxaConversao: Math.round(taxaConversao * 100) / 100 },
    financeiro: { totalFaturado, totalPendente, entreguesComPendencia, totalProjetos: projetos.length, faturamentoPorMes },
    producao: { porEtapa },
    avisos,
    projetosEmProducao,
  };
}

export default async function DashboardPage() {
const session = await getSession();
if (!session) redirect('/login');
if (!['GESTAO', 'COMERCIAL', 'ADMIN'].includes(session.role)) redirect('/producao');
const data = await getDashboardData();
return <DashboardClient data={data} />;
}