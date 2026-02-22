'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES: Record<string, string> = {
  COMERCIAL: 'Comercial',
  PRODUCAO: 'Produção',
  GESTAO: 'Gestão',
};

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

export default function UsuarioEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [role, setRole] = useState('COMERCIAL');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/usuarios/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && (data.error === 'Não autorizado' || data.error === 'Acesso negado')) {
          router.replace('/dashboard');
          return;
        }
        if (data.error) {
          setUsuario(null);
          return;
        }
        setUsuario(data);
        setNome(data.nome);
        setRole(data.role);
        setAtivo(data.ativo);
      })
      .catch(() => setUsuario(null));
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), role, ativo }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error || 'Erro ao salvar');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsuario(data);
      setNome(data.nome);
      setRole(data.role);
      setAtivo(data.ativo);
      setLoading(false);
    } catch {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  if (!usuario) {
    return (
      <div className="card">
        <p>Usuário não encontrado ou sem permissão.</p>
        <Link href="/usuarios" className="btn-primary mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/usuarios" className="text-slate-600 hover:text-slate-900">← Voltar</Link>
      <div className="card">
        <h1 className="mb-4 text-xl font-bold text-slate-800">Editar usuário</h1>
        <p className="mb-4 text-sm text-slate-500">E-mail: {usuario.email} (não editável)</p>
        <form onSubmit={handleSave} className="space-y-4">
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
            <label className="label">Papel</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <label htmlFor="ativo">Usuário ativo (pode fazer login)</label>
          </div>
          {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
