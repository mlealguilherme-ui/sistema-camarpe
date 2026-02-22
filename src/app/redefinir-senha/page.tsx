'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setErro('Link inválido. Solicite um novo na tela Esqueci minha senha.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao redefinir');
        setLoading(false);
        return;
      }
      setSucesso(true);
      setLoading(false);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="card max-w-sm">
          <p className="text-red-600">{erro}</p>
          <Link href="/esqueci-senha" className="btn-primary mt-4 inline-block">
            Solicitar novo link
          </Link>
          <Link href="/login" className="mt-2 block text-sm text-camarpe-600">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="mb-4 text-center text-xl font-bold text-camarpe-800">Nova senha</h1>
          {sucesso ? (
            <p className="text-center text-green-700">Senha alterada. Redirecionando para o login...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nova senha</label>
                <input
                  type="password"
                  className="input"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type="password"
                  className="input"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {erro && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
          <p className="mt-4 text-center">
            <Link href="/login" className="text-sm text-camarpe-600 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Carregando...</p>
      </div>
    }>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
