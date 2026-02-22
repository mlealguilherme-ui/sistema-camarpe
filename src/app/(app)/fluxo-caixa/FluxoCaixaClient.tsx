'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

const CATEGORIA_LABEL: Record<string, string> = {
  SALARIO: 'Salário',
  CONTAS_FIXAS: 'Contas fixas',
  FORNECEDORES: 'Fornecedores',
  INVESTIMENTO_EQUIPAMENTO: 'Invest. equipamento',
  INVESTIMENTO_APLICACAO: 'Invest. aplicação',
  IMPOSTOS: 'Impostos',
  OUTROS: 'Outros',
};

const REFERENCIA_SALARIO = ['Comercial', 'Produção', 'Gestão'];

interface Movimentacao {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  dataVencimento: string | null;
  dataPagamento: string | null;
  categoria: string | null;
  descricao: string;
  referenciaSalario: string | null;
  status: string;
  projetoId: string | null;
  projeto: { id: string; nome: string } | null;
}

type Aba = 'contas' | 'lancamentos' | 'relatorio';

export default function FluxoCaixaClient() {
  const [aba, setAba] = useState<Aba>('contas');
  const [contasAPagar, setContasAPagar] = useState<Movimentacao[]>([]);
  const [lancamentos, setLancamentos] = useState<Movimentacao[]>([]);
  const [mesFiltro, setMesFiltro] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [relatorio, setRelatorio] = useState<{
    mes?: string;
    entradasTotalRealizado?: number;
    saidasPago?: number;
    saldoRealizado?: number;
    saidasPrevisto?: number;
    entradasPrevisto?: number;
    entradasProjetos?: number;
    movimentacoes?: { id: string; tipo: string; valor: number; status: string; data: string; descricao: string; categoria: string | null }[];
  } | null>(null);
  const CAIXA_INICIAL_KEY = 'fluxo-caixa-inicial';
  const [caixaInicial, setCaixaInicial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  const [formTipo, setFormTipo] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [formValor, setFormValor] = useState('');
  const [formData, setFormData] = useState(() => new Date().toISOString().slice(0, 10));
  const [formDataVencimento, setFormDataVencimento] = useState('');
  const [formCategoria, setFormCategoria] = useState('CONTAS_FIXAS');
  const [formDescricao, setFormDescricao] = useState('');
  const [formReferenciaSalario, setFormReferenciaSalario] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([]);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/fluxo-caixa?contasAPagar=true').then((r) => r.json()),
      fetch(`/api/fluxo-caixa?mes=${mesFiltro}`).then((r) => r.json()),
      fetch(`/api/fluxo-caixa/relatorio?mes=${mesFiltro}`).then((r) => r.json()),
      fetch('/api/projetos?limit=100').then((r) => r.json()),
    ])
      .then(([contas, lanc, rel, proj]) => {
        setContasAPagar(Array.isArray(contas) ? contas : []);
        setLancamentos(Array.isArray(lanc) ? lanc : []);
        setRelatorio(rel.mes ? rel : null);
        const projList = proj?.data ?? (Array.isArray(proj) ? proj : []);
        setProjetos(projList.map((p: { id: string; nome: string }) => ({ id: p.id, nome: p.nome })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mesFiltro, aba]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CAIXA_INICIAL_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      setCaixaInicial(Number(obj[mesFiltro]) || 0);
    } catch {
      setCaixaInicial(0);
    }
  }, [mesFiltro]);

  function recarregar() {
    setLoading(true);
    Promise.all([
      fetch('/api/fluxo-caixa?contasAPagar=true').then((r) => r.json()),
      fetch(`/api/fluxo-caixa?mes=${mesFiltro}`).then((r) => r.json()),
      fetch(`/api/fluxo-caixa/relatorio?mes=${mesFiltro}`).then((r) => r.json()),
    ]).then(([contas, lanc, rel]) => {
      setContasAPagar(Array.isArray(contas) ? contas : []);
      setLancamentos(Array.isArray(lanc) ? lanc : []);
      setRelatorio(rel.mes ? rel : null);
      setLoading(false);
    });
  }

  async function marcarComoPago(id: string) {
    try {
      const res = await fetch(`/api/fluxo-caixa/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO' }),
      });
      if (res.ok) recarregar();
    } catch {
      // ignore
    }
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    const valor = parseFloat(formValor.replace(',', '.'));
    if (!formDescricao.trim() || isNaN(valor) || valor <= 0) {
      setErro('Descrição e valor positivo são obrigatórios.');
      setSaving(false);
      return;
    }
    if (formTipo === 'SAIDA' && !formCategoria) {
      setErro('Categoria é obrigatória para saída.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/fluxo-caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: formTipo,
          valor,
          data: formData + 'T12:00:00.000Z',
          dataVencimento: formDataVencimento ? formDataVencimento + 'T12:00:00.000Z' : null,
          categoria: formTipo === 'SAIDA' ? formCategoria : null,
          descricao: formDescricao.trim(),
          referenciaSalario: formTipo === 'SAIDA' && formCategoria === 'SALARIO' && formReferenciaSalario ? formReferenciaSalario : null,
          status: 'PREVISTO',
          projetoId: formProjetoId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || data.error || 'Erro ao criar');
        setSaving(false);
        return;
      }
      setLancamentos((prev) => [data, ...prev]);
      if (data.status === 'PREVISTO' && data.tipo === 'SAIDA' && data.dataVencimento) {
        setContasAPagar((prev) => [data, ...prev]);
      }
      setFormDescricao('');
      setFormValor('');
      setFormDataVencimento('');
      setShowNovo(false);
      setSaving(false);
      toast.showSuccess('Lançamento registrado.');
      recarregar();
    } catch {
      setErro('Erro ao criar');
      setSaving(false);
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const hoje = new Date();
  const seteDias = new Date(hoje);
  seteDias.setDate(seteDias.getDate() + 7);

  if (loading && contasAPagar.length === 0 && lancamentos.length === 0) {
    return <div className="card">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Fluxo de caixa</h1>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          type="button"
          className={`rounded-t px-4 py-2 text-sm font-medium ${aba === 'contas' ? 'border-b-2 border-camarpe-600 text-camarpe-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setAba('contas')}
        >
          Contas a pagar
          {contasAPagar.length > 0 && (
            <span className="ml-1 rounded bg-amber-100 px-1.5 text-amber-800">{contasAPagar.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`rounded-t px-4 py-2 text-sm font-medium ${aba === 'lancamentos' ? 'border-b-2 border-camarpe-600 text-camarpe-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setAba('lancamentos')}
        >
          Lançamentos
        </button>
        <button
          type="button"
          className={`rounded-t px-4 py-2 text-sm font-medium ${aba === 'relatorio' ? 'border-b-2 border-camarpe-600 text-camarpe-700' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setAba('relatorio')}
        >
          Relatório mensal
        </button>
      </div>

      {aba === 'contas' && (
        <section className="card">
          <p className="mb-3 text-sm text-slate-500">Saídas previstas com vencimento. Use para lembretes.</p>
          {contasAPagar.length === 0 ? (
            <p className="text-slate-500">Nenhuma conta a pagar com vencimento registrada.</p>
          ) : (
            <ul className="space-y-3">
              {contasAPagar.map((m) => {
                const venc = m.dataVencimento ? new Date(m.dataVencimento) : null;
                const vencido = venc && venc < hoje;
                const proximo = venc && venc >= hoje && venc <= seteDias;
                return (
                  <li
                    key={m.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${vencido ? 'border-red-200 bg-red-50/50' : proximo ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}
                  >
                    <div>
                      <span className="font-medium text-slate-800">{m.descricao}</span>
                      {m.categoria && (
                        <span className="ml-2 text-sm text-slate-500">{CATEGORIA_LABEL[m.categoria] ?? m.categoria}</span>
                      )}
                      {m.dataVencimento && (
                        <span className={`ml-2 text-sm ${vencido ? 'text-red-600 font-medium' : proximo ? 'text-amber-700' : 'text-slate-500'}`}>
                          Vence: {new Date(m.dataVencimento).toLocaleDateString('pt-BR')}
                          {vencido && ' (vencido)'}
                          {proximo && !vencido && ' (próximo)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{fmt(m.valor)}</span>
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        onClick={() => marcarComoPago(m.id)}
                      >
                        Marcar como pago
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {aba === 'lancamentos' && (
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label className="text-sm text-slate-600">
              Mês:
              <input
                type="month"
                className="input ml-2 w-40"
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
              />
            </label>
            <button type="button" className="btn-primary" onClick={() => setShowNovo(true)}>
              + Novo lançamento
            </button>
          </div>

          {showNovo && (
            <form onSubmit={handleCriar} className="card mb-4 space-y-3">
              <h2 className="font-semibold text-slate-800">Novo lançamento</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={formTipo} onChange={(e) => setFormTipo(e.target.value as 'ENTRADA' | 'SAIDA')}>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input type="text" className="input" value={formValor} onChange={(e) => setFormValor(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Data</label>
                  <input type="date" className="input" value={formData} onChange={(e) => setFormData(e.target.value)} />
                </div>
                <div>
                  <label className="label">Vencimento (opcional)</label>
                  <input type="date" className="input" value={formDataVencimento} onChange={(e) => setFormDataVencimento(e.target.value)} />
                </div>
                {formTipo === 'SAIDA' && (
                  <>
                    <div>
                      <label className="label">Categoria</label>
                      <select className="input" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)}>
                        {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    {formCategoria === 'SALARIO' && (
                      <div>
                        <label className="label">Salário de quem</label>
                        <select className="input" value={formReferenciaSalario} onChange={(e) => setFormReferenciaSalario(e.target.value)}>
                          <option value="">—</option>
                          {REFERENCIA_SALARIO.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="label">Vincular ao projeto (opcional)</label>
                      <select className="input" value={formProjetoId} onChange={(e) => setFormProjetoId(e.target.value)}>
                        <option value="">— Nenhum —</option>
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className="label">Descrição *</label>
                  <input type="text" className="input" value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Ex: Luz jan/25, Salário Comercial" />
                </div>
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
              </div>
            </form>
          )}

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Data</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Descrição</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Categoria</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-4 py-2">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-2">
                        {m.descricao}
                        {m.projeto && <span className="ml-1 text-slate-500">({m.projeto.nome})</span>}
                      </td>
                      <td className="px-4 py-2">{m.categoria ? CATEGORIA_LABEL[m.categoria] ?? m.categoria : '—'}</td>
                      <td className="px-4 py-2">{m.status === 'PAGO' ? 'Pago' : 'Previsto'}</td>
                      <td className={`px-4 py-2 text-right font-medium ${m.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{fmt(m.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lancamentos.length === 0 && <p className="p-4 text-slate-500">Nenhum lançamento neste mês.</p>}
          </div>
        </section>
      )}

      {aba === 'relatorio' && (
        <section className="card">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label className="text-sm text-slate-600">Mês: </label>
            <input type="month" className="input w-40" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Caixa inicial (R$):</label>
              <input
                type="number"
                step="0.01"
                className="input w-32"
                value={caixaInicial || ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setCaixaInicial(v);
                  try {
                    const raw = localStorage.getItem(CAIXA_INICIAL_KEY);
                    const obj = raw ? JSON.parse(raw) : {};
                    obj[mesFiltro] = v;
                    localStorage.setItem(CAIXA_INICIAL_KEY, JSON.stringify(obj));
                  } catch {
                    // ignore
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>
          {relatorio && (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Entradas (realizado + projetos)</p>
                  <p className="text-xl font-bold text-green-700">{fmt(relatorio.entradasTotalRealizado ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Saídas realizadas</p>
                  <p className="text-xl font-bold text-red-700">{fmt(relatorio.saidasPago ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Saídas previstas</p>
                  <p className="text-xl font-bold text-amber-700">{fmt(relatorio.saidasPrevisto ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-camarpe-800">Saldo realizado no mês</p>
                  <p className="text-xl font-bold text-camarpe-700">{fmt(relatorio.saldoRealizado ?? 0)}</p>
                </div>
                <div className="rounded-lg border-2 border-camarpe-200 bg-camarpe-50/50 p-4">
                  <p className="text-sm text-camarpe-800">Saldo com caixa inicial</p>
                  <p className="text-xl font-bold text-camarpe-700">{fmt((relatorio.saldoRealizado ?? 0) + caixaInicial)}</p>
                </div>
              </div>
              {relatorio.movimentacoes && relatorio.movimentacoes.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-medium text-slate-700">Relatório discriminado (movimentações do mês)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Data</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Descrição</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Tipo</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                          <th className="px-3 py-2 text-right font-medium text-slate-700">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.movimentacoes.map((mov) => (
                          <tr key={mov.id} className="border-b border-slate-100">
                            <td className="px-3 py-2">{new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                            <td className="px-3 py-2">{mov.descricao}</td>
                            <td className="px-3 py-2">{mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}{mov.categoria ? ` · ${CATEGORIA_LABEL[mov.categoria] ?? mov.categoria}` : ''}</td>
                            <td className="px-3 py-2">{mov.status === 'PAGO' ? 'Pago' : 'Previsto'}</td>
                            <td className={`px-3 py-2 text-right font-medium ${mov.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>
                              {mov.tipo === 'ENTRADA' ? '+' : '-'}{fmt(mov.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          {!relatorio?.mes && !loading && <p className="text-slate-500">Selecione um mês para ver o relatório.</p>}
        </section>
      )}
    </div>
  );
}
