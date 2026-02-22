'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set('status', filtroStatus);
    if (filtroOrigem) params.set('origem', filtroOrigem);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filtroStatus, filtroOrigem]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Leads</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/leads?${new URLSearchParams({
              ...(filtroStatus && { status: filtroStatus }),
              ...(filtroOrigem && { origem: filtroOrigem }),
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

      <div className="card flex flex-wrap gap-4">
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
      </div>

      {loading ? (
        <p>Carregando...</p>
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
                <th className="border-b p-3 text-left text-sm font-medium text-slate-700">Projeto</th>
                <th className="border-b p-3 text-right text-sm font-medium text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
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
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <p className="p-6 text-center text-slate-500">Nenhum lead encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
