'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

interface Contato {
  id: string;
  nome: string;
  telefone: string;
}

export default function TelefonesUteisPage() {
  const [list, setList] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const q = busca ? `?q=${encodeURIComponent(busca)}` : '';
    fetch(`/api/contatos-uteis${q}`)
      .then((r) => r.json())
      .then((d) => {
        setList(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [busca]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    const tel = telefone.replace(/\D/g, '');
    if (!nome.trim() || !tel) {
      setErro('Nome e telefone são obrigatórios.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/contatos-uteis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || data.error || 'Erro ao criar');
        setSaving(false);
        return;
      }
      setList((prev) => [data, ...prev]);
      setNome('');
      setTelefone('');
      setShowNovo(false);
      setSaving(false);
      toast.showSuccess('Contato adicionado.');
    } catch {
      setErro('Erro ao criar');
      setSaving(false);
    }
  }

  function formatarTel(t: string) {
    const d = t.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return t;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Telefones úteis</h1>
      <p className="text-sm text-slate-500">Fornecedores, parceiros e contatos frequentes.</p>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          className="input w-64"
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => setShowNovo(true)}>
          + Novo contato
        </button>
      </div>

      {showNovo && (
        <form onSubmit={handleCriar} className="card max-w-md space-y-3">
          <h2 className="font-semibold">Novo contato</h2>
          <div>
            <label className="label">Nome</label>
            <input type="text" className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ferragens Colonial" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input type="text" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="38999275417" />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-4 text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="p-4 text-slate-500">Nenhum contato.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50">
                <span className="font-medium text-slate-800">{c.nome}</span>
                <a
                  href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700"
                >
                  {formatarTel(c.telefone)} (WhatsApp)
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
