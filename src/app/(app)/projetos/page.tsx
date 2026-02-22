'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  lead?: { id: string; nome: string; telefone: string } | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [ordenar, setOrdenar] = useState<string>('atualizado');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set('statusProducao', filtroStatus);
    if (busca.trim()) params.set('busca', busca.trim());
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
  }, [filtroStatus, busca, ordenar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Projetos</h1>
        <div className="flex gap-2">
          <a href="/api/export/projetos" className="btn-secondary" download>
            Exportar CSV
          </a>
          <Link href="/projetos/novo" className="btn-primary">
            Novo projeto
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Buscar:</label>
          <input
            type="text"
            className="input w-48"
            placeholder="Nome ou cliente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Status:</label>
          <select className="input w-44" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Ordenar:</label>
          <select className="input w-40" value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
            <option value="atualizado">Mais recentes</option>
            <option value="nome">Nome (A–Z)</option>
            <option value="valor">Maior valor</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Carregando...</p>
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
      {!loading && projetos.length === 0 && (
        <p className="text-center text-slate-500">Nenhum projeto cadastrado.</p>
      )}
    </div>
  );
}
