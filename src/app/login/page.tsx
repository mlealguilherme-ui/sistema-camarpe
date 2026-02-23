'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao fazer login');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-800 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-navy-600 bg-white p-6 shadow-xl">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">Grupo</p>
          <h1 className="font-script mb-6 text-center text-3xl font-semibold text-navy-800">
            Camarpe
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600">Sistema de gestão</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {erro && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <p className="text-center text-sm">
              <Link href="/esqueci-senha" className="text-camarpe-600 hover:text-camarpe-500 hover:underline">
                Esqueci minha senha
              </Link>
            </p>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
            Use o seed para criar usuários (dev): POST /api/seed. Senha: camarpe123
          </p>
        </div>
      </div>
    </div>
  );
}
