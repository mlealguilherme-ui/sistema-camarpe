'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

interface Credencial {
  id: string;
  categoria: string;
  servico: string;
  login: string | null;
  senhaCriptografada: string;
}

export default function CredenciaisClient() {
  const [list, setList] = useState<Credencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [categoria, setCategoria] = useState('E-mail e Contas Principais');
  const [servico, setServico] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState<Record<string, string>>({});
  const toast = useToast();

  useEffect(() => {
    fetch('/api/credenciais')
      .then((r) => r.json())
      .then((d) => {
        setList(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    if (!servico.trim() || !senha) {
      setErro('Serviço e senha são obrigatórios.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/credenciais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, servico: servico.trim(), login: login.trim() || null, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || data.error || 'Erro ao criar');
        setSaving(false);
        return;
      }
      setList((prev) => [...prev, { ...data, login: data.login ?? null }]);
      setServico('');
      setLogin('');
      setSenha('');
      setShowNovo(false);
      setSaving(false);
      toast.showSuccess('Credencial salva.');
    } catch {
      setErro('Erro ao criar');
      setSaving(false);
    }
  }

  async function toggleSenha(id: string) {
    if (senhaVisivel[id]) {
      setSenhaVisivel((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    try {
      const res = await fetch(`/api/credenciais/${id}`);
      const data = await res.json();
      if (res.ok && data.senha) setSenhaVisivel((prev) => ({ ...prev, [id]: data.senha }));
    } catch {
      // ignore
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Excluir esta credencial?')) return;
    try {
      const res = await fetch(`/api/credenciais/${id}`, { method: 'DELETE' });
      if (res.ok) setList((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  const categorias = ['E-mail e Contas Principais', 'Cursos e Treinamentos'];
  const porCategoria = categorias.map((cat) => ({ categoria: cat, itens: list.filter((c) => c.categoria === cat) }));

  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Credenciais e acessos</h1>
      <p className="text-sm text-slate-500">Apenas Administrador. Senhas criptografadas. Use &quot;Mostrar&quot; para ver a senha.</p>

      <button type="button" className="btn-primary" onClick={() => setShowNovo(true)}>
        + Nova credencial
      </button>

      {showNovo && (
        <form onSubmit={handleCriar} className="card max-w-md space-y-3">
          <h2 className="font-semibold">Nova credencial</h2>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Serviço</label>
            <input type="text" className="input" value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Ex: Gmail, Curso Router" />
          </div>
          <div>
            <label className="label">Login / E-mail</label>
            <input type="text" className="input" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="grupocamarpe@gmail.com" />
          </div>
          <div>
            <label className="label">Senha *</label>
            <input type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {porCategoria.map(({ categoria: cat, itens }) => (
          <div key={cat} className="card">
            <h2 className="mb-3 font-semibold text-slate-800">{cat}</h2>
            {itens.length === 0 ? (
              <p className="text-slate-500">Nenhuma credencial.</p>
            ) : (
              <ul className="space-y-3">
                {itens.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3">
                    <div>
                      <span className="font-medium">{c.servico}</span>
                      {c.login && <span className="ml-2 text-slate-600">{c.login}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {senhaVisivel[c.id] ? senhaVisivel[c.id] : '••••••••'}
                      </span>
                      <button type="button" className="btn-secondary text-sm" onClick={() => toggleSenha(c.id)}>
                        {senhaVisivel[c.id] ? 'Ocultar' : 'Mostrar'}
                      </button>
                      <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => handleExcluir(c.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
