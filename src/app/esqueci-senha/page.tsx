'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLink('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao enviar');
        setLoading(false);
        return;
      }
      setSucesso(data.message || 'Se o e-mail existir, você receberá o link para redefinir a senha.');
      if (data.link) setLink(data.link);
      setLoading(false);
    } catch {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="mb-2 text-center text-xl font-bold text-camarpe-800">Esqueci minha senha</h1>
          <p className="mb-4 text-center text-sm text-slate-500">
            Informe seu e-mail para receber o link de redefinição.
          </p>
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
            {erro && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
            {sucesso && <p className="rounded-lg bg-green-50 p-2 text-sm text-green-800">{sucesso}</p>}
            {link && (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                Em desenvolvimento: <a href={link} className="underline">{link}</a>
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
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
