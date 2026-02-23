'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageLoader, EmptyState } from '@/components/PageLoader';

const STATUS: Record<string, string> = {
  AGUARDANDO_ARQUIVOS: 'Aguardando arquivos',
  PARA_CORTE: 'Para corte',
  MONTAGEM: 'Montagem',
  FITAGEM: 'Fitagem',
  PAUSADO: 'Pausado',
  INSTALACAO: 'Instalação',
  ENTREGUE: 'Entregue',
};

interface Projeto {
  id: string;
  nome: string;
  statusProducao: string;
  valorTotal: number;
  valorEntradaPago: number;
  valorPendente: number;
  dataPagamentoFinalPrevista: string | null;
  createdAt?: string;
  lead?: { id: string; nome: string; telefone: string } | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function ProjetosPage() {
  const searchParams = useSearchParams();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>(() => searchParams.get('statusProducao') || '');
  const [busca, setBusca] = useState('');
  const [periodoDe, setPeriodoDe] = useState('');
  const [periodoAte, setPeriodoAte] = useState('');
  const [ordenar, setOrdenar] = useState<string>('atualizado');
  const [vista, setVista] = useState<'cards' | 'tabela'>('cards');

  useEffect(() => {
    const sp = searchParams.get('statusProducao');
    if (sp) setFiltroStatus(sp);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set('statusProducao', filtroStatus);
    if (busca.trim()) params.set('busca', busca.trim());
    if (periodoDe) params.set('periodoDe', periodoDe);
    if (periodoAte) params.set('periodoAte', periodoAte);
    if (ordenar) params.set('ordenar', ordenar);
    setLoading(true);
    fetch(`/api/projetos?${params.toString()}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const list = data?.data ?? (Array.isArray(data) ? data : []);
        setProjetos(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filtroStatus, busca, periodoDe, periodoAte, ordenar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Projetos</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/projetos?${new URLSearchParams({
              ...(filtroStatus && { statusProducao: filtroStatus }),
              ...(busca.trim() && { busca: busca.trim() }),
              ...(periodoDe && { periodoDe }),
              ...(periodoAte && { periodoAte }),
            }).toString()}`}
            className="btn-secondary"
            download
          >
            Exportar CSV
          </a>
          <Link href="/projetos/novo" className="btn-primary">
            Novo projeto
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <label htmlFor="busca" className="label">Buscar (nome ou cliente)</label>
          <input
            id="busca"
            type="text"
            className="input w-full"
            placeholder="Nome ou cliente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filtro-status" className="label">Status produção</label>
          <select id="filtro-status" className="input w-44" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="periodo-de" className="label">Período (criação) — De</label>
          <input
            id="periodo-de"
            type="date"
            className="input w-40"
            value={periodoDe}
            onChange={(e) => setPeriodoDe(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="periodo-ate" className="label">Até</label>
          <input
            id="periodo-ate"
            type="date"
            className="input w-40"
            value={periodoAte}
            onChange={(e) => setPeriodoAte(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ordenar" className="label">Ordenar</label>
          <select id="ordenar" className="input w-40" value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
            <option value="atualizado">Mais recentes</option>
            <option value="nome">Nome (A–Z)</option>
            <option value="valor">Maior valor</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="label block">Vista</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${vista === 'cards' ? 'bg-navy-100 text-navy-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setVista('cards')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${vista === 'tabela' ? 'bg-navy-100 text-navy-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setVista('tabela')}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : projetos.length === 0 ? (
        <EmptyState
          title="Nenhum projeto cadastrado"
          description="Crie um projeto a partir de um lead ou diretamente."
          actionLabel="Novo projeto"
          actionHref="/projetos/novo"
        />
      ) : vista === 'tabela' ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b p-3 text-left font-medium text-slate-700">Nome</th>
                <th className="border-b p-3 text-left font-medium text-slate-700">Status produção</th>
                <th className="border-b p-3 text-right font-medium text-slate-700">Valor total</th>
                <th className="border-b p-3 text-right font-medium text-slate-700">Valor pendente</th>
                <th className="border-b p-3 text-left font-medium text-slate-700">Lead</th>
                <th className="border-b p-3 text-right font-medium text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((p) => (
                <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 ${p.statusProducao === 'ENTREGUE' && p.valorPendente > 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="p-3 font-medium text-slate-800">{p.nome}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {STATUS[p.statusProducao] ?? p.statusProducao}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-700">{fmt(p.valorTotal)}</td>
                  <td className={`p-3 text-right font-medium ${p.valorPendente > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                    {fmt(p.valorPendente)}
                  </td>
                  <td className="p-3 text-slate-600">{p.lead?.nome ?? '—'}</td>
                  <td className="p-3 text-right">
                    <Link href={`/projetos/${p.id}`} className="btn-secondary text-sm">
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => {
            const alerta = p.statusProducao === 'ENTREGUE' && p.valorPendente > 0;
            return (
              <Link
                key={p.id}
                href={`/projetos/${p.id}`}
                className={`card block transition hover:shadow-md ${
                  alerta ? 'border-red-300 bg-red-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-slate-800">{p.nome}</h2>
                  {alerta && (
                    <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800">
                      Pendência
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {STATUS[p.statusProducao] ?? p.statusProducao}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Total: {fmt(p.valorTotal)} · Já pago: {fmt(p.valorEntradaPago)} · A pagar: <span className={p.valorPendente > 0 ? 'font-semibold text-amber-700' : ''}>{fmt(p.valorPendente)}</span>
                </p>
                {p.lead && (
                  <p className="mt-1 text-xs text-slate-500">Lead: {p.lead.nome}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
