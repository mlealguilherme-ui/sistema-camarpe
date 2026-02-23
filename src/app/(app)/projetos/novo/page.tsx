'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function NovoProjetoPage() {
  const router = useRouter();
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [custoMateriais, setCustoMateriais] = useState('');
  const [custoMaoObra, setCustoMaoObra] = useState('');
  const [margemPct, setMargemPct] = useState('');
  const [qtdChapasMdf, setQtdChapasMdf] = useState('');
  const [leads, setLeads] = useState<{ id: string; nome: string }[]>([]);
  const [leadId, setLeadId] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLeads(list.filter((l: { projetos?: { id: string }[] }) => !l.projetos?.length));
      })
      .catch(() => {});
  }, []);

  function calcTotal() {
    const mat = parseFloat(custoMateriais) || 0;
    const mao = parseFloat(custoMaoObra) || 0;
    const margem = parseFloat(margemPct) || 0;
    if (mat && mao && margem) return (mat + mao) * (1 + margem / 100);
    return null;
  }

  const totalCalc = calcTotal();
  const valorExibir = valorTotal ? parseFloat(valorTotal) : totalCalc;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const valor = valorExibir ?? parseFloat(valorTotal);
    if (!valor || valor <= 0) {
      setErro('Informe o valor total ou preencha custos + margem.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          leadId: leadId || undefined,
          valorTotal: valor,
          custoMateriais: custoMateriais ? parseFloat(custoMateriais) : undefined,
          custoMaoObra: custoMaoObra ? parseFloat(custoMaoObra) : undefined,
          margemPct: margemPct ? parseFloat(margemPct) : undefined,
          qtdChapasMdf: qtdChapasMdf ? parseInt(qtdChapasMdf, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || 'Erro ao criar');
        setLoading(false);
        return;
      }
      toast.showSuccess('Projeto criado.');
      router.push(`/projetos/${data.id}`);
      router.refresh();
    } catch {
      setErro('Erro ao criar projeto');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projetos" className="text-slate-600 hover:text-slate-900">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Novo projeto</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome do projeto</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          {leads.length > 0 && (
            <div>
              <label className="label">Vincular a um lead (opcional)</label>
              <select
                className="input"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Valor total (R$) ou preencha custos + margem</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder={totalCalc ? `Calculado: ${totalCalc.toFixed(2)}` : ''}
            />
            {totalCalc != null && !valorTotal && (
              <p className="mt-1 text-sm text-slate-500">
                Valor calculado: R$ {totalCalc.toFixed(2)} (será usado ao salvar)
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Custo materiais (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={custoMateriais}
                onChange={(e) => setCustoMateriais(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Custo mão de obra (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={custoMaoObra}
                onChange={(e) => setCustoMaoObra(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Margem (%)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={margemPct}
                onChange={(e) => setMargemPct(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Qtd. chapas MDF</label>
              <input
                type="number"
                className="input"
                value={qtdChapasMdf}
                onChange={(e) => setQtdChapasMdf(e.target.value)}
              />
            </div>
          </div>
          {erro && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar projeto'}
            </button>
            <Link href="/projetos" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
