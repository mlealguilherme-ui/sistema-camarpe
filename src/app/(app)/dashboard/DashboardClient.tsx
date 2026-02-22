'use client';

import Link from 'next/link';

const ORIGEM_LABEL: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  ARQUITETO: 'Arquiteto',
  FACEBOOK: 'Facebook',
  SITE: 'Site',
};

const ETAPA_LABEL: Record<string, string> = {
  AGUARDANDO_ARQUIVOS: 'Aguard. arquivos',
  PARA_CORTE: 'Para corte',
  MONTAGEM: 'Montagem',
  INSTALACAO: 'Instalação',
  ENTREGUE: 'Entregue',
};

interface ProjetoEmProducao {
  id: string;
  nome: string;
  statusProducao: string;
  valorPendente: number;
  dataEntregaPrevista: string | null;
  cliente: string | null;
}

interface DashboardData {
  crm: {
    porStatus: Record<string, number>;
    porOrigem?: Record<string, number>;
    porMes?: { mes: string; total: number }[];
    totalLeads: number;
    convertidos: number;
    taxaConversao: number;
  };
  financeiro: {
    totalFaturado: number;
    totalPendente: number;
    entreguesComPendencia: number;
    totalProjetos: number;
    faturamentoPorMes?: { mes: string; valor: number }[];
  };
  producao?: { porEtapa: Record<string, number> };
  avisos?: { tipo: string; mensagem: string; link?: string; id?: string }[];
  projetosEmProducao?: ProjetoEmProducao[];
}

export default function DashboardClient({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <div className="card">
        <p>Carregando dados do dashboard...</p>
      </div>
    );
  }
  const { crm, financeiro, producao, avisos, projetosEmProducao } = data;
  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const maxLeadsMes = Math.max(1, ...(crm.porMes || []).map((m) => m.total));
  const maxFaturamento = Math.max(1, ...(financeiro.faturamentoPorMes || []).map((m) => m.valor));
  const maxEtapa = Math.max(1, ...Object.values(producao?.porEtapa || {}));
  const totalEmProducao = projetosEmProducao?.length ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Resumo: números em destaque */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4">
          <p className="text-sm font-medium text-amber-800">A receber</p>
          <p className="text-2xl font-bold text-amber-700">{fmt(financeiro.totalPendente)}</p>
        </div>
        <div className="rounded-xl border-2 border-camarpe-200 bg-camarpe-50/80 p-4">
          <p className="text-sm font-medium text-camarpe-800">Em produção</p>
          <p className="text-2xl font-bold text-camarpe-700">{totalEmProducao} projetos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Faturado (pago)</p>
          <p className="text-xl font-bold text-slate-800">{fmt(financeiro.totalFaturado)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Entregues com pendência</p>
          <p className="text-xl font-bold text-red-600">{financeiro.entreguesComPendencia}</p>
        </div>
      </section>

      {avisos && avisos.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="mb-3 font-semibold text-amber-800">Avisos</h2>
          <ul className="space-y-1">
            {avisos.map((a, i) => (
              <li key={a.id ?? a.link ?? i}>
                {a.link ? (
                  <Link href={a.link} className="text-amber-800 underline hover:text-amber-900">
                    {a.mensagem}
                  </Link>
                ) : (
                  <span className="text-amber-800">{a.mensagem}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Projetos em produção: quem está em que etapa */}
      {projetosEmProducao && projetosEmProducao.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Projetos em produção</h2>
          <p className="mb-3 text-sm text-slate-500">Cliente, etapa atual e valor a receber.</p>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Projeto / Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Etapa</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">A receber</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">Entrega prev.</th>
                  </tr>
                </thead>
                <tbody>
                  {projetosEmProducao.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2">
                        <Link href={`/projetos/${p.id}`} className="font-medium text-camarpe-600 hover:underline">
                          {p.nome}
                        </Link>
                        {p.cliente && p.cliente !== p.nome && (
                          <span className="ml-1 text-slate-500">({p.cliente})</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{ETAPA_LABEL[p.statusProducao] ?? p.statusProducao}</td>
                      <td className="px-4 py-2 text-right font-medium text-amber-700">{fmt(p.valorPendente)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {p.dataEntregaPrevista
                          ? new Date(p.dataEntregaPrevista).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Link href="/producao" className="btn-primary mt-2 inline-block">Ver produção</Link>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Funil de vendas (CRM)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-slate-500">Lead</p>
            <p className="text-2xl font-bold text-slate-800">{crm.porStatus.LEAD ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Orçamento enviado</p>
            <p className="text-2xl font-bold text-slate-800">{crm.porStatus.ORCAMENTO_ENVIADO ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Contrato assinado</p>
            <p className="text-2xl font-bold text-camarpe-600">{crm.porStatus.CONTRATO_ASSINADO ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Perdido</p>
            <p className="text-2xl font-bold text-slate-600">{crm.porStatus.PERDIDO ?? 0}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="card">
            <p className="text-sm text-slate-500">Total de leads</p>
            <p className="text-xl font-bold">{crm.totalLeads}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Convertidos em projeto</p>
            <p className="text-xl font-bold">{crm.convertidos}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Taxa de conversão</p>
            <p className="text-xl font-bold text-camarpe-600">{crm.taxaConversao}%</p>
          </div>
        </div>

        {crm.porOrigem && Object.keys(crm.porOrigem).length > 0 && (
          <div className="card mt-4">
            <h3 className="mb-3 text-sm font-medium text-slate-600">Leads por origem</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(crm.porOrigem).map(([origem, qtd]) => (
                <div key={origem} className="flex items-center gap-2">
                  <span className="w-24 text-sm">{ORIGEM_LABEL[origem] ?? origem}</span>
                  <div className="h-6 w-32 overflow-hidden rounded bg-slate-200">
                    <div
                      className="h-full bg-camarpe-500"
                      style={{ width: `${Math.min(100, (qtd / (crm.totalLeads || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{qtd}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {crm.porMes && crm.porMes.length > 0 && (
          <div className="card mt-4">
            <h3 className="mb-3 text-sm font-medium text-slate-600">Leads por mês (últimos 6)</h3>
            <div className="space-y-2">
              {crm.porMes.map((m) => (
                <div key={m.mes} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-slate-500">{m.mes}</span>
                  <div className="h-5 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-camarpe-400" style={{ width: `${(m.total / maxLeadsMes) * 100}%` }} />
                  </div>
                  <span className="text-sm">{m.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/leads" className="btn-primary mt-2 inline-block">Ver leads</Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Financeiro</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-slate-500">Total faturado (pago)</p>
            <p className="text-2xl font-bold text-camarpe-600">{fmt(financeiro.totalFaturado)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Total pendente</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(financeiro.totalPendente)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Entregues com pendência</p>
            <p className="text-2xl font-bold text-red-600">{financeiro.entreguesComPendencia}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Total de projetos</p>
            <p className="text-2xl font-bold text-slate-800">{financeiro.totalProjetos}</p>
          </div>
        </div>

        {financeiro.faturamentoPorMes && financeiro.faturamentoPorMes.length > 0 && (
          <div className="card mt-4">
            <h3 className="mb-3 text-sm font-medium text-slate-600">Faturamento por mês (últimos 6)</h3>
            <div className="space-y-2">
              {financeiro.faturamentoPorMes.map((m) => (
                <div key={m.mes} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-slate-500">{m.mes}</span>
                  <div className="h-5 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-green-500" style={{ width: `${(m.valor / maxFaturamento) * 100}%` }} />
                  </div>
                  <span className="text-sm">{fmt(m.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/projetos" className="btn-primary mt-2 inline-block">Ver projetos</Link>
      </section>

      {producao?.porEtapa && Object.keys(producao.porEtapa).length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Produção (por etapa)</h2>
          <div className="card">
            <div className="space-y-2">
              {Object.entries(producao.porEtapa).map(([etapa, qtd]) => (
                <div key={etapa} className="flex items-center gap-2">
                  <span className="w-36 text-sm">{ETAPA_LABEL[etapa] ?? etapa}</span>
                  <div className="h-6 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-slate-500" style={{ width: `${(qtd / maxEtapa) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium">{qtd}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/producao" className="btn-primary mt-2 inline-block">Ver produção</Link>
        </section>
      )}
    </div>
  );
}
