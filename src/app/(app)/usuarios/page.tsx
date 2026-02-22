'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  createdAt: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('COMERCIAL');
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then((data) => {
        if (data.error && (data.error === 'Não autorizado' || data.error === 'Acesso negado')) {
          router.replace('/dashboard');
          return;
        }
        setUsuarios(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!nome.trim() || !email.trim() || !senha || senha.length < 6) {
      setErro('Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios.');
      return;
    }
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao criar');
        return;
      }
      setUsuarios((prev) => [...prev, data]);
      setNome('');
      setEmail('');
      setSenha('');
      setShowNovo(false);
    } catch {
      setErro('Erro de conexão');
    }
  }

  async function toggleAtivo(u: Usuario) {
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !u.ativo }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsuarios((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        <button type="button" className="btn-primary" onClick={() => setShowNovo(true)}>
          Novo usuário
        </button>
      </div>

      {showNovo && (
        <div className="card">
          <h2 className="mb-4 font-semibold">Novo usuário</h2>
          <form onSubmit={handleCriar} className="space-y-4">
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
                required
              />
            </div>
            <div>
              <label className="label">Senha (mín. 6 caracteres)</label>
              <input
                type="password"
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
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
            {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Criar</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNovo(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-slate-600">
              <th className="p-2">Nome</th>
              <th className="p-2">E-mail</th>
              <th className="p-2">Papel</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="p-2 font-medium">{u.nome}</td>
                <td className="p-2 text-slate-600">{u.email}</td>
                <td className="p-2">{ROLES[u.role] ?? u.role}</td>
                <td className="p-2">
                  <span className={u.ativo ? 'text-green-600' : 'text-slate-400'}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-2">
                  <Link href={`/usuarios/${u.id}`} className="btn-secondary text-sm">
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="ml-2 text-sm text-amber-600 hover:underline"
                    onClick={() => toggleAtivo(u)}
                  >
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
