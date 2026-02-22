'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TrocarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senhaNova !== confirmar) {
      setErro('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/trocar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, senhaNova }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao alterar senha');
        setLoading(false);
        return;
      }
      setSucesso(true);
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmar('');
      setLoading(false);
    } catch {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Trocar senha</h1>
      <div className="card">
        {sucesso ? (
          <p className="text-green-700">Senha alterada com sucesso.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Senha atual</label>
              <input
                type="password"
                className="input"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">Nova senha</label>
              <input
                type="password"
                className="input"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirmar nova senha</label>
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
            {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        )}
        <p className="mt-4">
          <Link href="/dashboard" className="text-sm text-camarpe-600 hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
