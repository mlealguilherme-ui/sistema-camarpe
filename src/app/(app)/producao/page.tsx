'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [movendo, setMovendo] = useState<string | null>(null);
  const [filtroEtapa, setFiltroEtapa] = useState<string>(() => searchParams.get('statusProducao') || searchParams.get('etapa') || '');
  const { showSuccess, showError } = useToast();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sp = searchParams.get('statusProducao') || searchParams.get('etapa');
    if (sp) setFiltroEtapa(sp);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (filtroEtapa) params.set('statusProducao', filtroEtapa);
    fetch(`/api/projetos?${params.toString()}`)
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
  }, [filtroEtapa]);

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
        Toque no projeto para abrir. Arraste o card para outra coluna para avançar etapa, ou use o botão &quot;Próxima etapa&quot;.
      </p>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filtro-etapa" className="label">Filtrar por etapa</label>
          <select
            id="filtro-etapa"
            className="input w-56"
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
          >
            <option value="">Todas as etapas</option>
            {ETAPAS_ORDEM.map((e) => (
              <option key={e.id} value={e.id}>{e.titulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {porColuna.map((col) => (
            <div
              key={col.id}
              className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
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
                if (raw?.startsWith('projeto:')) {
                  const id = raw.replace(/^projeto:/, '');
                  if (id && col.id) {
                    const p = projetos.find((x) => x.id === id);
                    if (p && p.statusProducao !== col.id) avancarEtapa(id, col.id);
                  }
                }
              }}
            >
              <h2 className="mb-3 font-semibold text-slate-700">{col.titulo}</h2>
              <div className="space-y-3">
                {col.projetos.map((p) => {
                  const next = proximaEtapa(p.statusProducao);
                  const labelNext = labelProximaEtapa(p.statusProducao);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData('text/plain', `projeto:${p.id}`);
                        ev.dataTransfer.effectAllowed = 'move';
                      }}
                      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:cursor-grabbing ${movendo === p.id ? 'opacity-60' : ''}`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/projetos/${p.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/projetos/${p.id}`)}
                        className="focus:outline-none"
                      >
                        <p className="font-medium text-slate-800 hover:text-camarpe-600">{p.nome}</p>
                        {p.lead && (
                          <p className="mt-1 text-sm text-slate-500">{p.lead.nome}</p>
                        )}
                        <p className="mt-2 text-xs font-medium text-slate-600">
                          Entrega prevista:{' '}
                          {p.dataEntregaPrevista
                            ? new Date(p.dataEntregaPrevista).toLocaleDateString('pt-BR')
                            : '—'}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {next ? (
                          <button
                            type="button"
                            disabled={movendo === p.id}
                            className="w-full rounded-lg bg-camarpe-600 py-2.5 text-sm font-medium text-white hover:bg-camarpe-700 disabled:opacity-50"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              avancarEtapa(p.id, next);
                            }}
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
                          onClick={(e) => e.stopPropagation()}
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
