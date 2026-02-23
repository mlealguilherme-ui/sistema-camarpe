'use client';

import Link from 'next/link';
import PushNotifyPrompt from '@/components/PushNotifyPrompt';

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
  FITAGEM: 'Fitagem',
  PAUSADO: 'Pausado',
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

function CardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:ring-offset-2 ${className ?? ''}`}
    >
      {children}
    </Link>
  );
}

export default function DashboardClient({
  data,
  period = 6,
}: {
  data: DashboardData | null;
  period?: number;
}) {
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
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-navy-600 sm:text-3xl">Dashboard</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PushNotifyPrompt />
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <span className="px-2 text-sm text-slate-500">Período:</span>
          <Link
            href="/dashboard?period=6"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              period === 6 ? 'bg-navy-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            6 meses
          </Link>
          <Link
            href="/dashboard?period=12"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              period === 12 ? 'bg-navy-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            12 meses
          </Link>
          </div>
        </div>
      </div>

      {/* Resumo: números em destaque — cards clicáveis (drill-down) */}
      <section aria-label="Resumo financeiro e produção">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resumo
        </h2>
        <div className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <CardLink
            href="/projetos"
            className="rounded-xl border-2 border-amber-200 bg-amber-50/90 p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-amber-800">A receber</p>
            <p className="mt-1 text-2xl font-bold text-amber-700 min-[480px]:text-3xl">
              {fmt(financeiro.totalPendente)}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">Clique para ver projetos</p>
          </CardLink>
          <CardLink
            href="/producao"
            className="rounded-xl border-2 border-camarpe-200 bg-camarpe-50/90 p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-camarpe-800">Em produção</p>
            <p className="mt-1 text-2xl font-bold text-camarpe-700 min-[480px]:text-3xl">
              {totalEmProducao} projetos
            </p>
            <p className="mt-1 text-xs text-camarpe-700/80">Clique para ver produção</p>
          </CardLink>
          <CardLink
            href="/projetos"
            className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">Faturado (pago)</p>
            <p className="mt-1 text-xl font-bold text-navy-600 min-[480px]:text-2xl">
              {fmt(financeiro.totalFaturado)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Clique para ver projetos</p>
          </CardLink>
          <CardLink
            href="/projetos?statusProducao=ENTREGUE"
            className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-red-700">Entregues com pendência</p>
            <p className="mt-1 text-xl font-bold text-red-600 min-[480px]:text-2xl">
              {financeiro.entreguesComPendencia}
            </p>
            <p className="mt-1 text-xs text-red-700/80">Clique para ver lista</p>
          </CardLink>
        </div>
      </section>

      {avisos && avisos.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm" aria-label="Avisos">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-800">Avisos</h2>
          <ul className="space-y-1.5">
            {avisos.map((a, i) => (
              <li key={a.id ?? a.link ?? i}>
                {a.link ? (
                  <Link href={a.link} className="text-amber-800 underline decoration-amber-300 hover:text-amber-900 hover:decoration-amber-500">
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

      {projetosEmProducao && projetosEmProducao.length > 0 && (
        <section aria-label="Projetos em produção">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Projetos em produção</h2>
          <p className="mb-3 text-sm text-slate-500">Cliente, etapa atual e valor a receber.</p>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-navy-50/50">
                    <th className="px-4 py-3 text-left font-medium text-navy-700">Projeto / Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-navy-700">Etapa</th>
                    <th className="px-4 py-3 text-right font-medium text-navy-700">A receber</th>
                    <th className="px-4 py-3 text-right font-medium text-navy-700">Entrega prev.</th>
                  </tr>
                </thead>
                <tbody>
                  {projetosEmProducao.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
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
          <Link href="/producao" className="btn-primary mt-3 inline-block">Ver produção</Link>
        </section>
      )}

      <section aria-label="Funil de vendas">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Funil de vendas (CRM)</h2>
        <div className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <Link href="/leads?status=LEAD" className="card block transition hover:border-navy-300 hover:shadow-md">
            <p className="text-sm text-slate-500">Lead</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{crm.porStatus.LEAD ?? 0}</p>
          </Link>
          <Link href="/leads?status=ORCAMENTO_ENVIADO" className="card block transition hover:border-navy-300 hover:shadow-md">
            <p className="text-sm text-slate-500">Orçamento enviado</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{crm.porStatus.ORCAMENTO_ENVIADO ?? 0}</p>
          </Link>
          <Link href="/leads?status=CONTRATO_ASSINADO" className="card block transition hover:border-camarpe-300 hover:shadow-md">
            <p className="text-sm text-slate-500">Contrato assinado</p>
            <p className="mt-1 text-2xl font-bold text-camarpe-600">{crm.porStatus.CONTRATO_ASSINADO ?? 0}</p>
          </Link>
          <Link href="/leads?status=PERDIDO" className="card block transition hover:border-slate-300 hover:shadow-md">
            <p className="text-sm text-slate-500">Perdido</p>
            <p className="mt-1 text-2xl font-bold text-slate-600">{crm.porStatus.PERDIDO ?? 0}</p>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="card min-w-0 flex-1">
            <p className="text-sm text-slate-500">Total de leads</p>
            <p className="text-xl font-bold text-navy-600">{crm.totalLeads}</p>
          </div>
          <div className="card min-w-0 flex-1">
            <p className="text-sm text-slate-500">Convertidos em projeto</p>
            <p className="text-xl font-bold">{crm.convertidos}</p>
          </div>
          <div className="card min-w-0 flex-1">
            <p className="text-sm text-slate-500">Taxa de conversão</p>
            <p className="text-xl font-bold text-camarpe-600">{crm.taxaConversao}%</p>
          </div>
        </div>

        {crm.porOrigem && Object.keys(crm.porOrigem).length > 0 && (
          <div className="card mt-4">
            <h3 className="mb-3 text-sm font-medium text-navy-700">Leads por origem</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {Object.entries(crm.porOrigem).map(([origem, qtd]) => (
                <div key={origem} className="flex min-w-0 items-center gap-2">
                  <span className="w-24 shrink-0 text-sm text-slate-600">{ORIGEM_LABEL[origem] ?? origem}</span>
                  <div className="h-6 w-24 min-w-0 overflow-hidden rounded bg-slate-200 sm:w-32">
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
            <h3 className="mb-3 text-sm font-medium text-navy-700">Leads por mês (últimos {period})</h3>
            <div className="space-y-2">
              {crm.porMes.map((m) => (
                <div key={m.mes} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-slate-500 sm:w-20">{m.mes}</span>
                  <div className="h-5 min-w-0 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-camarpe-400" style={{ width: `${(m.total / maxLeadsMes) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium">{m.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/leads" className="btn-primary mt-3 inline-block">Ver leads</Link>
      </section>

      <section aria-label="Financeiro">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Financeiro</h2>
        <div className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-slate-500">Total faturado (pago)</p>
            <p className="mt-1 text-2xl font-bold text-camarpe-600">{fmt(financeiro.totalFaturado)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Total pendente</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{fmt(financeiro.totalPendente)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Entregues com pendência</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{financeiro.entreguesComPendencia}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Total de projetos</p>
            <p className="mt-1 text-2xl font-bold text-navy-600">{financeiro.totalProjetos}</p>
          </div>
        </div>

        {financeiro.faturamentoPorMes && financeiro.faturamentoPorMes.length > 0 && (
          <div className="card mt-4">
            <h3 className="mb-3 text-sm font-medium text-navy-700">Faturamento por mês (últimos {period})</h3>
            <div className="space-y-2">
              {financeiro.faturamentoPorMes.map((m) => (
                <div key={m.mes} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-slate-500 sm:w-20">{m.mes}</span>
                  <div className="h-5 min-w-0 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-navy-400" style={{ width: `${(m.valor / maxFaturamento) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium">{fmt(m.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/projetos" className="btn-primary mt-3 inline-block">Ver projetos</Link>
      </section>

      {producao?.porEtapa && Object.keys(producao.porEtapa).length > 0 && (
        <section aria-label="Produção por etapa">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Produção (por etapa)</h2>
          <div className="card">
            <div className="space-y-2">
              {Object.entries(producao.porEtapa).map(([etapa, qtd]) => (
                <div key={etapa} className="flex items-center gap-2">
                  <Link
                    href={`/producao?statusProducao=${encodeURIComponent(etapa)}`}
                    className="w-36 shrink-0 text-sm text-navy-600 hover:underline"
                  >
                    {ETAPA_LABEL[etapa] ?? etapa}
                  </Link>
                  <div className="h-6 min-w-0 flex-1 max-w-xs overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-navy-500" style={{ width: `${(qtd / maxEtapa) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium">{qtd}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/producao" className="btn-primary mt-3 inline-block">Ver produção</Link>
        </section>
      )}
    </div>
  );
}
