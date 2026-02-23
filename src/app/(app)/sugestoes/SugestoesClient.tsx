'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const STATUS_LABEL: Record<string, string> = {
  NOVA: 'Nova',
  EM_DISCUSSAO: 'Em discussão',
  APROVADA: 'Aprovada',
  IMPLEMENTADA: 'Implementada',
  ARQUIVADA: 'Arquivada',
};

interface Sugestao {
  id: string;
  texto: string;
  etapa: string | null;
  status: string;
  createdAt: string;
  usuario: { id: string; nome: string };
  projeto: { id: string; nome: string } | null;
}

interface SugestoesClientProps {
  podeAlterarStatus: boolean;
}

export default function SugestoesClient({ podeAlterarStatus }: SugestoesClientProps) {
  const searchParams = useSearchParams();
  const projetoIdFromUrl = searchParams.get('projetoId') ?? '';
  const etapaFromUrl = searchParams.get('etapa') ?? '';
  const [list, setList] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [texto, setTexto] = useState('');
  const [etapa, setEtapa] = useState(etapaFromUrl);
  const [projetoId, setProjetoId] = useState(projetoIdFromUrl);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setProjetoId((prev) => projetoIdFromUrl || prev);
    setEtapa((prev) => etapaFromUrl || prev);
  }, [projetoIdFromUrl, etapaFromUrl]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroStatus) params.set('status', filtroStatus);
    if (projetoIdFromUrl) params.set('projetoId', projetoIdFromUrl);
    fetch(`/api/sugestoes?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setList([...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filtroStatus, projetoIdFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    if (!texto.trim()) {
      setErro('Descreva a sugestão ou ideia.');
      setSaving(false);
      return;
    }
    const projetoIdEnviar = (projetoIdFromUrl || projetoId).trim() || undefined;
    try {
      const res = await fetch('/api/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: texto.trim(),
          etapa: etapa.trim() || undefined,
          projetoId: projetoIdEnviar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao enviar');
        setSaving(false);
        return;
      }
      setList((prev) => [data, ...prev]);
      setTexto('');
      setEtapa('');
      setShowForm(false);
      setSaving(false);
      toast.showSuccess('Sugestão registrada.');
    } catch {
      setErro('Erro ao enviar');
      setSaving(false);
    }
  }

  async function alterarStatus(id: string, novoStatus: string) {
    setAlterandoStatus(id);
    try {
      const res = await fetch(`/api/sugestoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setList((prev) => prev.map((s) => (s.id === id ? { ...s, status: data.status } : s)));
        toast.showSuccess('Status atualizado.');
      } else {
        toast.showError(data.error ?? 'Erro ao atualizar');
      }
    } catch {
      toast.showError('Erro ao atualizar');
    } finally {
      setAlterandoStatus(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Sugestões e ideias</h1>
      <p className="text-sm text-slate-500">
        Registre melhorias, insights da fábrica ou ideias que surgiram durante o trabalho. A gestão pode revisar, discutir e implementar.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nova sugestão'}
        </button>
        <div>
          <label className="label text-xs">Filtrar por status</label>
          <select
            className="input w-auto"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABEL).map(([k, v]) => {
          const count = list.filter((s) => s.status === k).length;
          return (
            <span
              key={k}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filtroStatus === k ? 'ring-2 ring-offset-1 ring-slate-400' : ''
              } ${
                k === 'NOVA' ? 'bg-blue-100 text-blue-800' :
                k === 'EM_DISCUSSAO' ? 'bg-amber-100 text-amber-800' :
                k === 'IMPLEMENTADA' ? 'bg-green-100 text-green-800' :
                k === 'ARQUIVADA' ? 'bg-slate-200 text-slate-600' :
                'bg-camarpe-100 text-camarpe-800'
              }`}
            >
              {v} <span className="font-semibold">{count}</span>
            </span>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card max-w-xl space-y-3">
          <h2 className="font-semibold text-slate-800">Registrar sugestão ou ideia</h2>
          <div>
            <label className="label">Sugestão / insight *</label>
            <textarea
              className="input min-h-[100px]"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: Usar uma braçadeira fixa na bancada do corte para peças pequenas evita deslize e acelera."
            />
          </div>
          <div>
            <label className="label">Contexto / etapa (opcional)</label>
            <input
              type="text"
              className="input"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              placeholder="Ex: Montagem, Corte, Instalação"
            />
          </div>
          {projetoIdFromUrl && (
            <p className="text-sm text-slate-500">Vinculada ao projeto atual.</p>
          )}
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-4 text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="p-4 text-slate-500">Nenhuma sugestão ainda. Clique em &quot;Nova sugestão&quot; para registrar uma ideia ou melhoria.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-slate-800">{s.texto}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {s.usuario.nome}
                      {s.etapa && ` · ${s.etapa}`}
                      {' · '}
                      {new Date(s.createdAt).toLocaleDateString('pt-BR')} às {new Date(s.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {s.projeto && (
                      <p className="mt-2">
                        <Link
                          href={`/projetos/${s.projeto.id}`}
                          className="inline-flex items-center rounded border border-camarpe-200 bg-camarpe-50/80 px-2.5 py-1 text-sm font-medium text-camarpe-800 hover:bg-camarpe-100"
                        >
                          Ver projeto: {s.projeto.nome} →
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === 'NOVA'
                          ? 'bg-blue-100 text-blue-800'
                          : s.status === 'EM_DISCUSSAO'
                            ? 'bg-amber-100 text-amber-800'
                            : s.status === 'IMPLEMENTADA'
                              ? 'bg-green-100 text-green-800'
                              : s.status === 'ARQUIVADA'
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-camarpe-100 text-camarpe-800'
                      }`}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                    {podeAlterarStatus && (
                      <select
                        className="input w-auto text-xs"
                        value={s.status}
                        disabled={alterandoStatus === s.id}
                        onChange={(e) => alterarStatus(s.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
