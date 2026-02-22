'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ORIGEM = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'ARQUITETO', label: 'Arquiteto' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'SITE', label: 'Site' },
  { value: 'AMIGO', label: 'Amigo' },
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'PARCEIRO', label: 'Parceiro' },
];

export default function NovoLeadPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('INDICACAO');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email: email || undefined, telefone, origem }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(typeof data.error === 'object' ? 'Dados inválidos' : data.error);
        setLoading(false);
        return;
      }
      router.push(`/leads/${data.id}`);
      router.refresh();
    } catch {
      setErro('Erro ao salvar');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="text-slate-600 hover:text-slate-900">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Novo lead</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="opcional"
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              type="tel"
              className="input"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Origem</label>
            <select
              className="input"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
            >
              {ORIGEM.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {erro && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <Link href="/leads" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
