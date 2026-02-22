'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const ETAPAS_ORDEM: { id: string; titulo: string; short: string }[] = [
  { id: 'AGUARDANDO_ARQUIVOS', titulo: 'Aguardando arquivos', short: 'Arquivos' },
  { id: 'PARA_CORTE', titulo: 'Para corte (CNC)', short: 'Corte' },
  { id: 'MONTAGEM', titulo: 'Montagem', short: 'Montagem' },
  { id: 'FITAGEM', titulo: 'Fitagem', short: 'Fitagem' },
  { id: 'PAUSADO', titulo: 'Pausado', short: 'Pausado' },
  { id: 'INSTALACAO', titulo: 'Instalação', short: 'Instalação' },
  { id: 'ENTREGUE', titulo: 'Entregue', short: 'Entregue' },
];

function proximaEtapa(status: string): string | null {
  const idx = ETAPAS_ORDEM.findIndex((e) => e.id === status);
  if (idx < 0 || idx >= ETAPAS_ORDEM.length - 1) return null;
  return ETAPAS_ORDEM[idx + 1].id;
}

function labelProximaEtapa(status: string): string {
  const next = proximaEtapa(status);
  if (!next) return '';
  const e = ETAPAS_ORDEM.find((x) => x.id === next);
  return e ? e.short : next;
}

interface Projeto {
  id: string;
  nome: string;
  statusProducao: string;
  dataEntregaPrevista?: string | null;
  updatedAt?: string;
  lead?: { nome: string } | null;
}

export default function ProducaoPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [movendo, setMovendo] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projetos?limit=100')
      .then((r) => r.json())
      .then((data) => {
        const list = data?.data ?? (Array.isArray(data) ? data : []);
        setProjetos(list);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao carregar projetos. Tente recarregar a página.');
        setLoading(false);
      });
  }, []);

  async function avancarEtapa(projetoId: string, novoStatus: string) {
    setMovendo(projetoId);
    try {
      const res = await fetch(`/api/projetos/${projetoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusProducao: novoStatus }),
      });
      if (res.ok) {
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId ? { ...p, statusProducao: novoStatus } : p
          )
        );
        const labelNovo = ETAPAS_ORDEM.find((e) => e.id === novoStatus)?.short ?? novoStatus;
        showSuccess(`Projeto movido para: ${labelNovo}`);
      } else {
        const err = await res.json().catch(() => ({}));
        showError(err?.error ?? 'Erro ao mover projeto');
      }
    } catch {
      showError('Erro de conexão ao mover projeto');
    } finally {
      setMovendo(null);
    }
  }

  const porColuna = ETAPAS_ORDEM.map((col) => ({
    ...col,
    projetos: projetos.filter((p) => p.statusProducao === col.id),
  }));

  if (loading) return <p className="card">Carregando...</p>;
  if (erro) return <p className="card text-red-600">{erro}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Central de produção</h1>
      <p className="text-sm text-slate-500">
        Toque no projeto para abrir. Use <strong>Próxima etapa</strong> para avançar. No celular: use o botão grande em cada card.
      </p>

      {/* Visual em colunas (desktop) / lista por etapa (mobile com scroll horizontal) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {porColuna.map((col) => (
            <div
              key={col.id}
              className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <h2 className="mb-3 font-semibold text-slate-700">{col.titulo}</h2>
              <div className="space-y-3">
                {col.projetos.map((p) => {
                  const next = proximaEtapa(p.statusProducao);
                  const labelNext = labelProximaEtapa(p.statusProducao);
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <Link
                        href={`/projetos/${p.id}`}
                        className="block font-medium text-slate-800 hover:text-camarpe-600"
                      >
                        {p.nome}
                      </Link>
                      {p.lead && (
                        <p className="mt-1 text-sm text-slate-500">{p.lead.nome}</p>
                      )}
                      {(p.dataEntregaPrevista || p.updatedAt) && (
                        <p className="mt-1 text-xs text-slate-400">
                          {p.dataEntregaPrevista
                            ? `Entrega prev.: ${new Date(p.dataEntregaPrevista).toLocaleDateString('pt-BR')}`
                            : `Atualizado: ${new Date(p.updatedAt || '').toLocaleDateString('pt-BR')}`}
                        </p>
                      )}
                      <div className="mt-3 flex flex-col gap-2">
                        {next ? (
                          <button
                            type="button"
                            disabled={movendo === p.id}
                            className="w-full rounded-lg bg-camarpe-600 py-2.5 text-sm font-medium text-white hover:bg-camarpe-700 disabled:opacity-50"
                            onClick={() => avancarEtapa(p.id, next)}
                          >
                            {movendo === p.id ? '...' : `Próxima etapa → ${labelNext}`}
                          </button>
                        ) : null}
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v && v !== p.statusProducao) avancarEtapa(p.id, v);
                            e.target.value = '';
                          }}
                        >
                          <option value="">Saltar para...</option>
                          {ETAPAS_ORDEM.filter((e) => e.id !== p.statusProducao).map((e) => (
                            <option key={e.id} value={e.id}>{e.titulo}</option>
                          ))}
                        </select>
                      </div>
                      {!next && (
                        <p className="mt-2 text-xs text-slate-400">Entregue</p>
                      )}
                    </div>
                  );
                })}
                {col.projetos.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">Nenhum</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
