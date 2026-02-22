'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function ImportarClient() {
  const [clientes, setClientes] = useState<File | null>(null);
  const [orcamentos, setOrcamentos] = useState<File | null>(null);
  const [producao, setProducao] = useState<File | null>(null);
  const [financeiro, setFinanceiro] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok?: boolean;
    message?: string;
    leadsCriados?: number;
    leadsAtualizados?: number;
    projetosCriados?: number;
    projetosAtualizados?: number;
    pagamentosCriados?: number;
    erros?: string[];
  } | null>(null);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientes && !orcamentos && !producao && !financeiro) {
      toast.showError('Selecione ao menos um arquivo CSV.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      if (clientes) formData.append('clientes', clientes);
      if (orcamentos) formData.append('orcamentos', orcamentos);
      if (producao) formData.append('producao', producao);
      if (financeiro) formData.append('financeiro', financeiro);

      const res = await fetch('/api/import/planilhas', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) toast.showSuccess(data.message ?? 'Importação concluída.');
      else toast.showError(data.error ?? 'Erro na importação.');
    } catch {
      toast.showError('Erro ao enviar arquivos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Importar planilhas</h1>
      <p className="text-sm text-slate-500">
        Envie os 4 CSVs na ordem: <strong>Clientes</strong>, <strong>Orçamentos</strong>, <strong>Produção</strong> e <strong>Financeiro</strong>.
        Pode enviar só alguns; a importação usa a ordem interna (clientes primeiro, depois orçamentos, produção e financeiro).
      </p>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div>
          <label className="label">1. Clientes (Nome, Telefone, E-mail, Endereço, Observações)</label>
          <input
            type="file"
            accept=".csv"
            className="input"
            onChange={(e) => setClientes(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label">2. Orçamentos (Nome do Cliente, Descrição do Projeto, Status, Valor Proposto, Links, etc.)</label>
          <input
            type="file"
            accept=".csv"
            className="input"
            onChange={(e) => setOrcamentos(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label">3. Produção (ID, Cliente, Descrição, Status Atual, Início, Prazo, Valor do Projeto)</label>
          <input
            type="file"
            accept=".csv"
            className="input"
            onChange={(e) => setProducao(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label">4. Financeiro (ID PRODUÇÃO, Cliente, Descrição do Pgto, Data Vencimento, Valor, Status Pagto, Data Recebimento)</label>
          <input
            type="file"
            accept=".csv"
            className="input"
            onChange={(e) => setFinanceiro(e.target.files?.[0] ?? null)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {result && (
        <div className="card max-w-2xl space-y-2">
          <h2 className="font-semibold text-slate-800">Resultado</h2>
          {result.ok && (
            <ul className="text-sm text-slate-600">
              <li>Leads criados: {result.leadsCriados ?? 0}</li>
              <li>Leads atualizados: {result.leadsAtualizados ?? 0}</li>
              <li>Projetos criados: {result.projetosCriados ?? 0}</li>
              <li>Projetos atualizados: {result.projetosAtualizados ?? 0}</li>
              <li>Pagamentos criados: {result.pagamentosCriados ?? 0}</li>
            </ul>
          )}
          {result.erros && result.erros.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-amber-700">Avisos / não importados:</p>
              <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                {result.erros.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.erros.length > 10 && <li>… e mais {result.erros.length - 10}</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
