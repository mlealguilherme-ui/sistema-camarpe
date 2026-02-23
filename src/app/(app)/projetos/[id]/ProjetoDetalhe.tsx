'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { useToast } from '@/components/Toast';

const STATUS_OPCOES = [
  { value: 'AGUARDANDO_ARQUIVOS', label: 'Aguardando arquivos' },
  { value: 'PARA_CORTE', label: 'Para corte (CNC)' },
  { value: 'MONTAGEM', label: 'Montagem' },
  { value: 'FITAGEM', label: 'Fitagem' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'ENTREGUE', label: 'Entregue' },
];
const ETAPA_LABEL: Record<string, string> = {
  AGUARDANDO_ARQUIVOS: 'Aguard. arquivos',
  PARA_CORTE: 'Para corte',
  MONTAGEM: 'Montagem',
  FITAGEM: 'Fitagem',
  PAUSADO: 'Pausado',
  INSTALACAO: 'Instalação',
  ENTREGUE: 'Entregue',
};
const TIPOS_ARQUIVO: Record<string, string> = {
  GCODE: 'G-code',
  TRES_D: '3D',
  PDF_CORTE: 'PDF corte',
  CONTRATO: 'Contrato',
};

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

interface ProjetoDetalheProps {
  projeto: Record<string, unknown>;
  onUpdate: (p: Record<string, unknown>) => void;
}

export default function ProjetoDetalhe({ projeto, onUpdate }: ProjetoDetalheProps) {
  const router = useRouter();
  const toast = useToast();
  const [aba, setAba] = useState<'resumo' | 'financeiro' | 'arquivos' | 'compras'>('resumo');
  const [excluindoProjeto, setExcluindoProjeto] = useState(false);
  const [statusProducao, setStatusProducao] = useState(
    (projeto.statusProducao as string) || 'AGUARDANDO_ARQUIVOS'
  );
  const [valorPagamento, setValorPagamento] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState<'ENTRADA' | 'FINAL'>('ENTRADA');
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [obsPagamento, setObsPagamento] = useState('');
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState('');
  const [uploadTipo, setUploadTipo] = useState<'GCODE' | 'TRES_D' | 'PDF_CORTE' | 'CONTRATO'>('GCODE');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErro, setUploadErro] = useState('');
  const [chapasCompradas, setChapasCompradas] = useState(
    (projeto.checklistCompras as { chapasCompradas?: boolean })?.chapasCompradas ?? false
  );
  const [ferragensCompradas, setFerragensCompradas] = useState(
    (projeto.checklistCompras as { ferragensCompradas?: boolean })?.ferragensCompradas ?? false
  );
  const [outrosItens, setOutrosItens] = useState(
    (projeto.checklistCompras as { outrosItens?: string })?.outrosItens ?? ''
  );
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [editEntrega, setEditEntrega] = useState(false);
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [fluxoValor, setFluxoValor] = useState('');
  const [fluxoDescricao, setFluxoDescricao] = useState('');
  const [fluxoData, setFluxoData] = useState(() => new Date().toISOString().slice(0, 10));
  const [fluxoSaving, setFluxoSaving] = useState(false);
  const [fluxoErro, setFluxoErro] = useState('');
  const [saidasFluxoProjeto, setSaidasFluxoProjeto] = useState<{ id: string; valor: number; data: string; descricao: string; status: string }[]>([]);
  const [materialDescricao, setMaterialDescricao] = useState('');
  const [materialQtd, setMaterialQtd] = useState('');
  const [materiaisSaving, setMateriaisSaving] = useState(false);
  const custoMateriais = Number(projeto.custoMateriais ?? 0);

  const id = projeto.id as string;
  const lead = projeto.lead as { nome: string; telefone?: string } | null;
  const pagamentos = (projeto.pagamentos as { id: string; valor: number; tipo: string; data: string | null; dataVencimento?: string | null; linkComprovante?: string | null }[]) || [];
  const arquivos = (projeto.arquivos as { id: string; tipo: string; nomeOriginal: string }[]) || [];
  const materiais = (projeto.materiais as { id: string; descricao: string; quantidade: number | null }[]) || [];
  const valorTotal = Number(projeto.valorTotal ?? 0);
  const valorEntradaPago = Number(projeto.valorEntradaPago ?? 0);
  const valorPendente = Number(projeto.valorPendente ?? 0);
  const dataPrevista = projeto.dataPagamentoFinalPrevista as string | null;
  const dataEntregaPrevista = projeto.dataEntregaPrevista as string | null;
  const dataEntregaReal = projeto.dataEntregaReal as string | null;
  const dataInicioProducao = projeto.dataInicioProducao as string | null;
  const observacoesProjeto = projeto.observacoes as string | null;
  const linkOrcamento = projeto.linkOrcamento as string | null;
  const linkProjeto3d = projeto.linkProjeto3d as string | null;

  const [dataEntregaPrevistaInput, setDataEntregaPrevistaInput] = useState(
    (projeto.dataEntregaPrevista as string)?.slice(0, 16) ?? ''
  );
  const [dataEntregaRealInput, setDataEntregaRealInput] = useState(
    (projeto.dataEntregaReal as string)?.slice(0, 16) ?? ''
  );
  useEffect(() => {
    setDataEntregaPrevistaInput((projeto.dataEntregaPrevista as string)?.slice(0, 16) ?? '');
    setDataEntregaRealInput((projeto.dataEntregaReal as string)?.slice(0, 16) ?? '');
  }, [projeto.dataEntregaPrevista, projeto.dataEntregaReal]);

  const loadSaidasFluxoProjeto = useCallback(async () => {
    try {
      const r = await fetch(`/api/fluxo-caixa?projetoId=${id}&tipo=SAIDA`);
      if (!r.ok) return;
      const arr = await r.json();
      setSaidasFluxoProjeto(Array.isArray(arr) ? arr.map((m: { id: string; valor: number; data: string; descricao: string; status: string }) => ({ id: m.id, valor: m.valor, data: m.data, descricao: m.descricao, status: m.status })) : []);
    } catch {
      setSaidasFluxoProjeto([]);
    }
  }, [id]);

  useEffect(() => {
    if (aba === 'compras' && id) loadSaidasFluxoProjeto();
  }, [aba, id, loadSaidasFluxoProjeto]);
  const createdBy = projeto.createdBy as { nome: string } | null;
  const updatedBy = projeto.updatedBy as { nome: string } | null;
  const logsStatus = (projeto.logsStatus as { deStatus: string; paraStatus: string; usuario: { nome: string } | null; createdAt: string }[]) || [];
  const alertaPendencia =
    (projeto.statusProducao as string) === 'ENTREGUE' && valorPendente > 0;

  async function handleSalvarDatasEntrega() {
    setSavingEntrega(true);
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataEntregaPrevista: dataEntregaPrevistaInput ? new Date(dataEntregaPrevistaInput).toISOString() : null,
          dataEntregaReal: dataEntregaRealInput ? new Date(dataEntregaRealInput).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate({ ...projeto, ...data });
        setEditEntrega(false);
      }
    } finally {
      setSavingEntrega(false);
    }
  }

  async function handleMudarStatus() {
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusProducao }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate({ ...projeto, ...data });
        setStatusProducao(data.statusProducao);
      }
    } catch {
      // ignore
    }
  }

  async function handleRegistrarPagamento(e: React.FormEvent) {
    e.preventDefault();
    setErroPagamento('');
    setLoadingPagamento(true);
    const valor = parseFloat(valorPagamento);
    if (!valor || valor <= 0) {
      setErroPagamento('Valor inválido.');
      setLoadingPagamento(false);
      return;
    }
    try {
      const res = await fetch(`/api/projetos/${id}/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor,
          tipo: tipoPagamento,
          data: new Date(dataPagamento).toISOString(),
          observacao: obsPagamento || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroPagamento(data.error || 'Erro ao registrar');
        setLoadingPagamento(false);
        return;
      }
      const novosPagamentos = [...pagamentos, { ...data }];
      const novoEntrada =
        tipoPagamento === 'ENTRADA' ? valorEntradaPago + valor : valorEntradaPago;
      const novoPendente = valorPendente - valor;
      onUpdate({
        ...projeto,
        pagamentos: novosPagamentos,
        valorEntradaPago: novoEntrada,
        valorPendente: novoPendente,
      });
      setValorPagamento('');
      setObsPagamento('');
      setLoadingPagamento(false);
    } catch {
      setErroPagamento('Erro ao registrar');
      setLoadingPagamento(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadErro('');
    const form = new FormData();
    form.append('file', uploadFile);
    form.append('tipo', uploadTipo);
    try {
      const res = await fetch(`/api/projetos/${id}/arquivos`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate({
          ...projeto,
          arquivos: [...arquivos, data],
        });
        setUploadFile(null);
      } else {
        setUploadErro(data?.message || data?.error || `Erro ${res.status} ao enviar arquivo.`);
      }
      setUploading(false);
    } catch (err) {
      setUploadErro(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
      setUploading(false);
    }
  }

  async function handleExcluirArquivo(arquivoId: string) {
    if (!confirm('Excluir este arquivo?')) return;
    try {
      const res = await fetch(`/api/projetos/${id}/arquivos/${arquivoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onUpdate({
          ...projeto,
          arquivos: arquivos.filter((a: { id: string }) => a.id !== arquivoId),
        });
      }
    } catch {
      // ignore
    }
  }

  async function handleSalvarChecklist() {
    setSavingChecklist(true);
    try {
      const res = await fetch(`/api/projetos/${id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapasCompradas,
          ferragensCompradas,
          outrosItens: outrosItens || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({
          ...projeto,
          checklistCompras: data,
        });
      }
      setSavingChecklist(false);
    } catch {
      setSavingChecklist(false);
    }
  }

  async function handleLancarSaidaFluxo(e: React.FormEvent) {
    e.preventDefault();
    setFluxoErro('');
    setFluxoSaving(true);
    const valor = parseFloat(fluxoValor.replace(',', '.'));
    const descricao = (fluxoDescricao || `Material - ${projeto.nome as string}`).trim();
    if (isNaN(valor) || valor <= 0) {
      setFluxoErro('Informe um valor positivo.');
      setFluxoSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/fluxo-caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'SAIDA',
          valor,
          data: fluxoData + 'T12:00:00.000Z',
          dataVencimento: null,
          categoria: 'FORNECEDORES',
          descricao,
          status: 'PREVISTO',
          projetoId: id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFluxoErro(data.error?.message || data.error || 'Erro. Apenas Gestão/Admin podem lançar.');
        setFluxoSaving(false);
        return;
      }
      setFluxoValor('');
      setFluxoDescricao('');
      setFluxoSaving(false);
      loadSaidasFluxoProjeto();
    } catch {
      setFluxoErro('Erro ao lançar.');
      setFluxoSaving(false);
    }
  }

  async function handleAdicionarMaterial(e: React.FormEvent) {
    e.preventDefault();
    const descricao = materialDescricao.trim();
    if (!descricao) return;
    setMateriaisSaving(true);
    try {
      const qtd = materialQtd.trim() ? parseInt(materialQtd, 10) : null;
      const novaLista = [...materiais.map((m) => ({ descricao: m.descricao, quantidade: m.quantidade })), { descricao, quantidade: qtd ?? undefined }];
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materiais: novaLista }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate({ ...projeto, materiais: data.materiais ?? [] });
        setMaterialDescricao('');
        setMaterialQtd('');
      }
    } catch {
      // ignore
    } finally {
      setMateriaisSaving(false);
    }
  }

  async function handleRemoverMaterial(arquivoId: string) {
    const novaLista = materiais.filter((m) => m.id !== arquivoId).map((m) => ({ descricao: m.descricao, quantidade: m.quantidade }));
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materiais: novaLista }),
      });
      const data = await res.json();
      if (res.ok) onUpdate({ ...projeto, materiais: data.materiais ?? [] });
    } catch {
      // ignore
    }
  }

  const abas = [
    { id: 'resumo' as const, label: 'Resumo' },
    { id: 'financeiro' as const, label: 'Financeiro' },
    { id: 'arquivos' as const, label: 'Arquivos (cofre)' },
    { id: 'compras' as const, label: 'Compras' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/projetos" className="text-slate-600 hover:text-slate-900">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{projeto.nome as string}</h1>
          {alertaPendencia && (
            <span className="rounded bg-red-200 px-2 py-1 text-sm font-medium text-red-800">
              Entregue com valor pendente
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/sugestoes?projetoId=${id}&etapa=${encodeURIComponent(ETAPA_LABEL[statusProducao] ?? statusProducao)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Lightbulb size={18} />
            Registrar sugestão
          </Link>
          <button
            type="button"
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
            disabled={excluindoProjeto}
            onClick={async () => {
              if (!confirm('Excluir este projeto? Esta ação não pode ser desfeita.')) return;
              setExcluindoProjeto(true);
              try {
                const res = await fetch(`/api/projetos/${id}`, { method: 'DELETE' });
                if (!res.ok) {
                  const data = await res.json();
                  toast.showError(data.error || 'Erro ao excluir');
                  setExcluindoProjeto(false);
                  return;
                }
                toast.showSuccess('Projeto excluído.');
                router.push('/projetos');
                router.refresh();
              } catch {
                toast.showError('Erro ao excluir');
                setExcluindoProjeto(false);
              }
            }}
          >
            {excluindoProjeto ? 'Excluindo...' : 'Excluir projeto'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              aba === a.id
                ? 'bg-white text-camarpe-700 shadow-sm border border-b-0 border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'resumo' && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-camarpe-200 bg-camarpe-50/50 p-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-camarpe-800">Valor total</p>
              <p className="text-xl font-bold text-slate-800">{fmt(valorTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Já pago</p>
              <p className="text-xl font-bold text-green-700">{fmt(valorEntradaPago)}</p>
            </div>
            <div>
              <p className="text-sm text-amber-700">A pagar</p>
              <p className="text-xl font-bold text-amber-700">{fmt(valorPendente)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {STATUS_OPCOES.map((o, i) => {
              const ativo = statusProducao === o.value;
              const idx = STATUS_OPCOES.findIndex((s) => s.value === statusProducao);
              const concluido = i < idx;
              return (
                <span
                  key={o.value}
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    ativo ? 'bg-camarpe-600 text-white' : concluido ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {o.label}
                </span>
              );
            })}
          </div>

        <div className="card space-y-4">
          {lead && (
            <p>
              <span className="font-medium text-slate-700">Cliente (lead):</span> {lead.nome}
              {lead.telefone && ` · ${lead.telefone}`}
            </p>
          )}
          <div>
            <label className="label">Status da produção</label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input w-auto"
                value={statusProducao}
                onChange={(e) => setStatusProducao(e.target.value)}
              >
                {STATUS_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                onClick={handleMudarStatus}
              >
                Atualizar status
              </button>
            </div>
          </div>
          {dataInicioProducao && (
            <p><span className="font-medium text-slate-700">Início produção:</span> {new Date(dataInicioProducao).toLocaleDateString('pt-BR')}</p>
          )}
          <div>
            <h3 className="mb-2 font-medium text-slate-700">Documentos e links</h3>
            <ul className="space-y-2">
              {linkOrcamento && (
                <li>
                  <a href={linkOrcamento} target="_blank" rel="noopener noreferrer" className="text-camarpe-600 hover:underline">Orçamento (link externo)</a>
                </li>
              )}
              {linkProjeto3d && (
                <li>
                  <a href={linkProjeto3d} target="_blank" rel="noopener noreferrer" className="text-camarpe-600 hover:underline">Projeto 3D (link externo)</a>
                </li>
              )}
              {arquivos.length > 0 && arquivos.map((a: { id: string; tipo: string; nomeOriginal: string }) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="text-slate-600">{TIPOS_ARQUIVO[a.tipo] ?? a.tipo}: {a.nomeOriginal}</span>
                  <a href={`/api/projetos/${id}/arquivos/${a.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-camarpe-600 hover:underline">Ver</a>
                  <a href={`/api/projetos/${id}/arquivos/${a.id}`} download={a.nomeOriginal} className="btn-secondary text-sm">Baixar</a>
                </li>
              ))}
              {!linkOrcamento && !linkProjeto3d && arquivos.length === 0 && (
                <li className="text-slate-500">Nenhum documento ou link.</li>
              )}
            </ul>
          </div>
          {observacoesProjeto && (
            <p><span className="font-medium text-slate-700">Observações:</span> {observacoesProjeto}</p>
          )}
          {dataPrevista && (
            <p>
              <span className="font-medium text-slate-700">Data prevista pagamento final:</span>{' '}
              {new Date(dataPrevista).toLocaleDateString('pt-BR')}
            </p>
          )}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium text-slate-700">Datas de entrega</span>
              <button
                type="button"
                className="text-sm text-camarpe-600 hover:underline"
                onClick={() => setEditEntrega((e) => !e)}
              >
                {editEntrega ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            {editEntrega ? (
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="label text-xs">Previsão entrega</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={dataEntregaPrevistaInput}
                    onChange={(e) => setDataEntregaPrevistaInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Data real entrega</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={dataEntregaRealInput}
                    onChange={(e) => setDataEntregaRealInput(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSalvarDatasEntrega}
                  disabled={savingEntrega}
                >
                  {savingEntrega ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            ) : (
              (dataEntregaPrevista || dataEntregaReal) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {dataEntregaPrevista && (
                    <p>
                      <span className="font-medium text-slate-700">Previsão entrega:</span>{' '}
                      {new Date(dataEntregaPrevista).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {dataEntregaReal && (
                    <p>
                      <span className="font-medium text-slate-700">Data real entrega:</span>{' '}
                      {new Date(dataEntregaReal).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
          {(createdBy || updatedBy) && (
            <p className="text-sm text-slate-500">
              {createdBy && <>Criado por: {createdBy.nome}</>}
              {updatedBy && <> · Atualizado por: {updatedBy.nome}</>}
            </p>
          )}
          {logsStatus.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-slate-700">Histórico de status</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {logsStatus.map((log: { deStatus: string; paraStatus: string; usuario: { nome: string } | null; createdAt: string }, i: number) => (
                  <li key={i}>
                    {ETAPA_LABEL[log.deStatus] ?? log.deStatus} → {ETAPA_LABEL[log.paraStatus] ?? log.paraStatus}
                    {log.usuario?.nome && ` · ${log.usuario.nome}`}
                    {' · '}
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        </div>
      )}

      {aba === 'financeiro' && (
        <div className="space-y-6">
          <div className="card grid gap-4 sm:grid-cols-3">
            <p className="text-lg font-semibold">Total: {fmt(valorTotal)}</p>
            <p className="text-lg font-semibold text-green-600">Já pago: {fmt(valorEntradaPago)}</p>
            <p className="text-lg font-semibold text-amber-600">Valor a pagar: {fmt(valorPendente)}</p>
          </div>
          <div className="card">
            <h2 className="mb-4 font-semibold">Registrar pagamento</h2>
            <form onSubmit={handleRegistrarPagamento} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={tipoPagamento}
                    onChange={(e) => setTipoPagamento(e.target.value as 'ENTRADA' | 'FINAL')}
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="FINAL">Pagamento final</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Data</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Observação (opcional)</label>
                <input
                  type="text"
                  className="input"
                  value={obsPagamento}
                  onChange={(e) => setObsPagamento(e.target.value)}
                />
              </div>
              {erroPagamento && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erroPagamento}</p>
              )}
              <button type="submit" className="btn-primary" disabled={loadingPagamento}>
                {loadingPagamento ? 'Registrando...' : 'Registrar pagamento'}
              </button>
            </form>
          </div>
          <div className="card">
            <h2 className="mb-2 font-semibold">Histórico de pagamentos</h2>
            <ul className="divide-y divide-slate-100">
              {pagamentos.length === 0 ? (
                <li className="py-2 text-slate-500">Nenhum pagamento registrado.</li>
              ) : (
                pagamentos.map((p: { id: string; valor: number; tipo: string; data: string | null; dataVencimento?: string | null; linkComprovante?: string | null }) => (
                  <li key={p.id} className="flex justify-between py-2">
                    <span>
                      {p.tipo === 'ENTRADA' ? 'Entrada' : 'Final'} · {fmt(p.valor)}
                      {p.data
                        ? ` · ${new Date(p.data).toLocaleDateString('pt-BR')}`
                        : p.dataVencimento
                          ? ` · Venc. ${new Date(p.dataVencimento).toLocaleDateString('pt-BR')} (a receber)`
                          : ' · A receber'}
                      {p.linkComprovante && (
                        <a href={p.linkComprovante} target="_blank" rel="noopener noreferrer" className="ml-2 text-camarpe-600 hover:underline">Comprovante</a>
                      )}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {aba === 'arquivos' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 font-semibold">Upload de arquivo (cofre do projeto)</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label">Tipo</label>
                <select
                  className="input w-auto"
                  value={uploadTipo}
                  onChange={(e) =>
                    setUploadTipo(e.target.value as 'GCODE' | 'TRES_D' | 'PDF_CORTE' | 'CONTRATO')
                  }
                >
                  <option value="GCODE">G-code (Router/CNC)</option>
                  <option value="TRES_D">3D (imagem/ SketchUp)</option>
                  <option value="PDF_CORTE">PDF plano de corte</option>
                  <option value="CONTRATO">Contrato PDF</option>
                </select>
              </div>
              <div>
                <label className="label">Arquivo</label>
                <input
                  type="file"
                  className="input"
                  accept=".gcode,.nc,.pdf,.jpg,.jpeg,.png,.skp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {uploadErro && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-700">{uploadErro}</p>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
          <div className="card">
            <h2 className="mb-4 font-semibold">Arquivos no cofre</h2>
            <p className="mb-2 text-sm text-slate-500">
              Produção: baixe no PC e passe para o pendrive da CNC.
            </p>
            <ul className="divide-y divide-slate-100">
              {arquivos.length === 0 ? (
                <li className="py-4 text-slate-500">Nenhum arquivo.</li>
              ) : (
                arquivos.map((a: { id: string; tipo: string; nomeOriginal: string }) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span>
                      {TIPOS_ARQUIVO[a.tipo] ?? a.tipo}: {a.nomeOriginal}
                    </span>
                    <div className="flex gap-2">
                      <a
                        href={`/api/projetos/${id}/arquivos/${a.id}`}
                        download={a.nomeOriginal}
                        className="btn-secondary text-sm"
                      >
                        Baixar
                      </a>
                      <button
                        type="button"
                        className="btn-danger text-sm"
                        onClick={() => handleExcluirArquivo(a.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {aba === 'compras' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 font-semibold">Checklist de compras</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={chapasCompradas}
                  onChange={(e) => setChapasCompradas(e.target.checked)}
                />
                <span>Chapas compradas?</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ferragensCompradas}
                  onChange={(e) => setFerragensCompradas(e.target.checked)}
                />
                <span>Ferragens compradas?</span>
              </label>
              <div>
                <label className="label">Outros itens (texto livre)</label>
                <textarea
                  className="input min-h-[80px]"
                  value={outrosItens}
                  onChange={(e) => setOutrosItens(e.target.value)}
                  placeholder="Ex: cola, fita de borda..."
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSalvarChecklist}
                disabled={savingChecklist}
              >
                {savingChecklist ? 'Salvando...' : 'Salvar checklist'}
              </button>
            </div>
          </div>
          <div className="card">
            <h2 className="mb-2 font-semibold">Lista de materiais comprados</h2>
            <p className="mb-4 text-sm text-slate-500">
              Materiais necessários / comprados para este projeto (MDF, ferragens, cola, etc.).
            </p>
            <form onSubmit={handleAdicionarMaterial} className="mb-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[200px]">
                <label className="label">Descrição</label>
                <input
                  type="text"
                  className="input"
                  value={materialDescricao}
                  onChange={(e) => setMaterialDescricao(e.target.value)}
                  placeholder="Ex: MDF 15mm, Dobradiças"
                />
              </div>
              <div className="w-24">
                <label className="label">Qtd</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={materialQtd}
                  onChange={(e) => setMaterialQtd(e.target.value)}
                  placeholder="—"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={materiaisSaving}>
                {materiaisSaving ? 'Salvando...' : 'Adicionar'}
              </button>
            </form>
            {materiais.length === 0 ? (
              <p className="text-slate-500">Nenhum material registrado.</p>
            ) : (
              <ul className="space-y-2">
                {materiais.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <span>{m.descricao}{m.quantidade != null ? ` · ${m.quantidade} un` : ''}</span>
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => handleRemoverMaterial(m.id)}>Excluir</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2 className="mb-2 font-semibold">Registrar saída no fluxo de caixa</h2>
            <p className="mb-4 text-sm text-slate-500">
              Ao comprar material deste projeto, lance aqui para aparecer no fluxo de caixa (Gestão/Admin).
            </p>
            <form onSubmit={handleLancarSaidaFluxo} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Valor (R$)</label>
                  <input
                    type="text"
                    className="input"
                    value={fluxoValor}
                    onChange={(e) => setFluxoValor(e.target.value)}
                    placeholder={custoMateriais > 0 ? String(custoMateriais) : '0,00'}
                  />
                </div>
                <div>
                  <label className="label">Data</label>
                  <input type="date" className="input" value={fluxoData} onChange={(e) => setFluxoData(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <input
                  type="text"
                  className="input"
                  value={fluxoDescricao}
                  onChange={(e) => setFluxoDescricao(e.target.value)}
                  placeholder={`Material - ${projeto.nome as string}`}
                />
              </div>
              {fluxoErro && <p className="text-sm text-red-600">{fluxoErro}</p>}
              <button type="submit" className="btn-primary" disabled={fluxoSaving}>
                {fluxoSaving ? 'Lançando...' : 'Lançar saída no fluxo'}
              </button>
            </form>
            {saidasFluxoProjeto.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-sm font-medium text-slate-700">Saídas lançadas neste projeto</h3>
                <ul className="space-y-2 text-sm">
                  {saidasFluxoProjeto.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 bg-slate-50/50 px-3 py-2">
                      <span className="text-slate-800">{m.descricao}</span>
                      <span className="text-slate-500">{new Date(m.data).toLocaleDateString('pt-BR')}</span>
                      <span className="font-medium text-red-700">{fmt(m.valor)}</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs ${m.status === 'PAGO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {m.status === 'PAGO' ? 'Pago' : 'Previsto'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
