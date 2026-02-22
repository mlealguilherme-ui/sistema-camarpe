'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ItemEstoque {
  id: string;
  nome: string;
  quantidadeMinima: number;
  quantidadeAtual: number;
  avisoAtivo: boolean;
}

interface Resposta {
  itens: ItemEstoque[];
  alertas: ItemEstoque[];
}

export default function ComprasPage() {
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [alertas, setAlertas] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [quantidadeMinima, setQuantidadeMinima] = useState('1');
  const [quantidadeAtual, setQuantidadeAtual] = useState('0');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editMinimo, setEditMinimo] = useState('');

  useEffect(() => {
    fetch('/api/estoque-alerta')
      .then((r) => r.json())
      .then((data: Resposta) => {
        setItens(data.itens ?? []);
        setAlertas(data.alertas ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    const min = parseInt(quantidadeMinima, 10);
    const atual = parseInt(quantidadeAtual, 10);
    if (!nome.trim() || isNaN(min) || min < 0) {
      setErro('Nome e quantidade mínima válida são obrigatórios.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/estoque-alerta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          quantidadeMinima: min,
          quantidadeAtual: isNaN(atual) ? 0 : atual,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || 'Erro ao criar');
        setSaving(false);
        return;
      }
      setItens((prev) => [...prev, data]);
      if (data.quantidadeAtual < data.quantidadeMinima && data.avisoAtivo) {
        setAlertas((prev) => [...prev, data]);
      }
      setNome('');
      setQuantidadeMinima('1');
      setQuantidadeAtual('0');
      setShowNovo(false);
      setSaving(false);
    } catch {
      setErro('Erro ao criar');
      setSaving(false);
    }
  }

  async function refetch() {
    const res = await fetch('/api/estoque-alerta');
    const data: Resposta = await res.json();
    if (res.ok) {
      setItens(data.itens ?? []);
      setAlertas(data.alertas ?? []);
    }
  }

  async function handleAtualizarQtd(item: ItemEstoque, novaQtd: number) {
    try {
      const res = await fetch(`/api/estoque-alerta/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidadeAtual: novaQtd }),
      });
      if (res.ok) await refetch();
    } catch {
      // ignore
    }
  }

  function iniciarEdicao(item: ItemEstoque) {
    setEditId(item.id);
    setEditNome(item.nome);
    setEditMinimo(String(item.quantidadeMinima));
  }

  async function salvarEdicao() {
    if (!editId) return;
    const min = parseInt(editMinimo, 10);
    if (!editNome.trim() || isNaN(min) || min < 0) return;
    try {
      const res = await fetch(`/api/estoque-alerta/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome.trim(), quantidadeMinima: min }),
      });
      if (res.ok) {
        await refetch();
        setEditId(null);
      }
    } catch {
      // ignore
    }
  }

  function cancelarEdicao() {
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Estoque (alertas)</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowNovo(true)}
        >
          Novo item de alerta
        </button>
      </div>

      {alertas.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/50">
          <h2 className="mb-2 font-semibold text-amber-800">Alertas — abaixo do mínimo</h2>
          <ul className="space-y-1">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>
                  <strong>{a.nome}</strong>: {a.quantidadeAtual} / {a.quantidadeMinima} (comprar
                  mais)
                </span>
                <input
                  type="number"
                  className="input w-20 text-sm"
                  defaultValue={a.quantidadeAtual}
                  min={0}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0) handleAtualizarQtd(a, v);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-slate-500">
        O checklist por projeto (chapas, ferragens) fica na aba &quot;Compras&quot; dentro de cada projeto. Aqui são
        apenas itens de estoque com quantidade mínima para lembrete (ex.: cola, fita de borda).
      </p>

      {showNovo && (
        <div className="card">
          <h2 className="mb-4 font-semibold">Novo item (alerta de estoque)</h2>
          <form onSubmit={handleCriar} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cola, Fita borda branca"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Quantidade mínima</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={quantidadeMinima}
                  onChange={(e) => setQuantidadeMinima(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Quantidade atual</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={quantidadeAtual}
                  onChange={(e) => setQuantidadeAtual(e.target.value)}
                />
              </div>
            </div>
            {erro && (
              <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNovo(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="mb-4 font-semibold">Itens com alerta de estoque</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : itens.length === 0 ? (
          <p className="text-slate-500">Nenhum item cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-slate-600">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Mínimo</th>
                  <th className="p-2">Atual</th>
                  <th className="p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    {editId === item.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            className="input w-full text-sm"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            className="input w-20 text-sm"
                            value={editMinimo}
                            onChange={(e) => setEditMinimo(e.target.value)}
                          />
                        </td>
                        <td className="p-2">{item.quantidadeAtual}</td>
                        <td className="p-2 flex gap-1">
                          <button type="button" className="btn-primary text-sm" onClick={salvarEdicao}>Salvar</button>
                          <button type="button" className="btn-secondary text-sm" onClick={cancelarEdicao}>Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-medium">{item.nome}</td>
                        <td className="p-2">{item.quantidadeMinima}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            className="input w-20 text-sm"
                            defaultValue={item.quantidadeAtual}
                            onBlur={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 0) handleAtualizarQtd(item, v);
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <button type="button" className="text-sm text-camarpe-600 hover:underline mr-2" onClick={() => iniciarEdicao(item)}>Editar</button>
                          {item.quantidadeAtual < item.quantidadeMinima && (
                            <span className="text-amber-600">Abaixo do mínimo</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        <Link href="/projetos" className="text-camarpe-600 hover:underline">
          Ver projetos
        </Link>{' '}
        para checklist de compras por projeto (chapas, ferragens).
      </p>
    </div>
  );
}
