'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLoader, EmptyState } from '@/components/PageLoader';

const ORIGEM: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  ARQUITETO: 'Arquiteto',
  FACEBOOK: 'Facebook',
  SITE: 'Site',
  AMIGO: 'Amigo',
  FAMILIAR: 'Familiar',
  PARCEIRO: 'Parceiro',
};
const STATUS: Record<string, string> = {
  LEAD: 'Lead',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  CONTRATO_ASSINADO: 'Contrato assinado',
  PERDIDO: 'Perdido',
};

interface Lead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  origem: string;
  status: string;
  motivoPerda: string | null;
  projetos?: { id: string; nome: string }[];
  updatedAt: string;
  dataUltimoContato?: string | null;
}

const STATUS_ORDER = ['LEAD', 'ORCAMENTO_ENVIADO', 'CONTRATO_ASSINADO', 'PERDIDO'] as const;

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>(() => searchParams.get('status') || '');
  const [filtroOrigem, setFiltroOrigem] = useState<string>(() => searchParams.get('origem') || '');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [vista, setVista] = useState<'tabela' | 'kanban'>('tabela');
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const origem = searchParams.get('origem');
    if (status) setFiltroStatus(status);
    if (origem) setFiltroOrigem(origem);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set('status', filtroStatus);
    if (filtroOrigem) params.set('origem', filtroOrigem);
    if (buscaDebounced) params.set('search', buscaDebounced);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filtroStatus, filtroOrigem, buscaDebounced]);

  async function moveLeadStatus(leadId: string, novoStatus: string) {
    setMovingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          ...(novoStatus === 'PERDIDO' ? { motivoPerda: 'Alterado no Kanban' } : {}),
        }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: novoStatus } : l))
        );
      }
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Leads</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/leads?${new URLSearchParams({
              ...(filtroStatus && { status: filtroStatus }),
              ...(filtroOrigem && { origem: filtroOrigem }),
              ...(buscaDebounced && { search: buscaDebounced }),
            }).toString()}`}
            className="btn-secondary"
            download
          >
            Exportar CSV
          </a>
          <Link href="/leads/novo" className="btn-primary">
            Novo lead
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="busca" className="label">Buscar (nome ou telefone)</label>
          <input
            id="busca"
            type="text"
            className="input w-full"
            placeholder="Digite nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filtro-status" className="label">Status</label>
          <select
            id="filtro-status"
            className="input w-auto"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-origem" className="label">Origem</label>
          <select
            id="filtro-origem"
            className="input w-auto"
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(ORIGEM).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <span className="label block">Vista</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${vista === 'tabela' ? 'bg-navy-100 text-navy-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setVista('tabela')}
            >
              Tabela
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${vista === 'kanban' ? 'bg-navy-100 text-navy-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setVista('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead encontrado"
          description="Cadastre o primeiro lead para começar a acompanhar o funil."
          actionLabel="Novo lead"
          actionHref="/leads/novo"
        />
      ) : vista === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {STATUS_ORDER.map((statusId) => {
              const colLeads = leads.filter((l) => l.status === statusId);
              return (
                <div
                  key={statusId}
                  className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-camarpe-400');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-camarpe-400');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-camarpe-400');
                    const raw = e.dataTransfer.getData('text/plain');
                    if (raw?.startsWith('lead:')) {
                      const id = raw.replace(/^lead:/, '');
                      if (id) moveLeadStatus(id, statusId);
                    }
                  }}
                >
                  <h3 className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                    {STATUS[statusId] ?? statusId}
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{colLeads.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData('text/plain', `lead:${lead.id}`);
                          ev.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => router.push(`/leads/${lead.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/leads/${lead.id}`)}
                        className={`cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-camarpe-300 hover:shadow ${movingId === lead.id ? 'opacity-60' : ''}`}
                      >
                        <p className="font-medium text-slate-800">{lead.nome}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{lead.telefone}</p>
                        {lead.dataUltimoContato && (
                          <p className="mt-1 text-xs text-slate-500">
                            Último contato: {new Date(lead.dataUltimoContato).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg border border-slate-200 bg-white">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Nome</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">E-mail</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Telefone</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Origem</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Último contato</th>
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Projeto</th>
                <th className="border-b p-3 text-right text-sm font-medium text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const ultimoContato = lead.dataUltimoContato ? new Date(lead.dataUltimoContato) : null;
                const diasSemContato = ultimoContato ? Math.floor((Date.now() - ultimoContato.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const ultimoContatoClass =
                  diasSemContato === null
                    ? 'text-slate-400'
                    : diasSemContato > 14
                      ? 'font-medium text-red-700'
                      : diasSemContato > 7
                        ? 'text-amber-700'
                        : 'text-slate-600';
                return (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{lead.nome}</td>
                    <td className="p-3 text-slate-600">{lead.email ?? '—'}</td>
                    <td className="p-3 text-slate-600">{lead.telefone}</td>
                    <td className="p-3">{ORIGEM[lead.origem] ?? lead.origem}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.status === 'PERDIDO'
                            ? 'bg-red-100 text-red-800'
                            : lead.status === 'CONTRATO_ASSINADO'
                              ? 'bg-camarpe-100 text-camarpe-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {STATUS[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className={`p-3 text-sm ${ultimoContatoClass}`}>
                      {ultimoContato
                        ? `${ultimoContato.toLocaleDateString('pt-BR')}${diasSemContato !== null && diasSemContato > 7 ? ` (${diasSemContato}d)` : ''}`
                        : '—'}
                    </td>
                    <td className="p-3">
                      {lead.projetos?.length ? (
                        lead.projetos.length === 1 ? (
                          <Link href={`/projetos/${lead.projetos[0].id}`} className="text-camarpe-600 hover:underline">
                            {lead.projetos[0].nome}
                          </Link>
                        ) : (
                          <span className="text-slate-600">
                            {lead.projetos.length} projeto(s) —{' '}
                            <Link href={`/projetos/${lead.projetos[0].id}`} className="text-camarpe-600 hover:underline">
                              Ver
                            </Link>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/leads/${lead.id}`} className="btn-secondary text-sm">
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
