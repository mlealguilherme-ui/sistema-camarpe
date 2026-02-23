'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const ORIGEM: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  ARQUITETO: 'Arquiteto',
  FACEBOOK: 'Facebook',
  SITE: 'Site',
  AMIGO: 'Amigo',
  FAMILIAR: 'Familiar',
  PARCEIRO: 'Parceiro',
};

const TIPO_ATIVIDADE: Record<string, string> = {
  LIGACAO: 'Ligação',
  EMAIL_ENVIADO: 'E-mail enviado',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  CONTATO_WHATSAPP: 'Contato WhatsApp',
  OBSERVACAO: 'Observação',
};
const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ORCAMENTO_ENVIADO', label: 'Orçamento enviado' },
  { value: 'CONTRATO_ASSINADO', label: 'Contrato assinado' },
  { value: 'PERDIDO', label: 'Perdido' },
];
const MOTIVOS_PERDA = [
  'Achou caro',
  'Fechou com concorrente',
  'Desistiu do projeto',
  'Outro',
];

interface Atividade {
  id: string;
  tipo: string;
  descricao: string | null;
  usuario: { nome: string } | null;
  createdAt: string;
}

interface Lead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  origem: string;
  status: string;
  motivoPerda: string | null;
  descricaoProjeto?: string | null;
  observacoes?: string | null;
  dataUltimoContato?: string | null;
  linkOrcamento?: string | null;
  linkProjeto3d?: string | null;
  endereco?: string | null;
  projetos?: { id: string; nome: string }[];
  atividades?: Atividade[];
  createdAt: string;
  updatedAt: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [edit, setEdit] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('INDICACAO');
  const [status, setStatus] = useState('');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [showNovaAtividade, setShowNovaAtividade] = useState(false);
  const [novaAtividadeTipo, setNovaAtividadeTipo] = useState('OBSERVACAO');
  const [novaAtividadeDesc, setNovaAtividadeDesc] = useState('');
  const [salvandoAtividade, setSalvandoAtividade] = useState(false);
  const [valorTotal, setValorTotal] = useState('');
  const [custoMateriais, setCustoMateriais] = useState('');
  const [custoMaoObra, setCustoMaoObra] = useState('');
  const [margemPct, setMargemPct] = useState('');
  const [qtdChapasMdf, setQtdChapasMdf] = useState('');
  const [descricaoProjeto, setDescricaoProjeto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [endereco, setEndereco] = useState('');
  const [linkOrcamento, setLinkOrcamento] = useState('');
  const [linkProjeto3d, setLinkProjeto3d] = useState('');
  const [dataUltimoContato, setDataUltimoContato] = useState('');
  const [showExcluirModal, setShowExcluirModal] = useState(false);
  const [excluindoLead, setExcluindoLead] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLead(null);
          return;
        }
        setLead(data);
        setNome(data.nome);
        setEmail(data.email || '');
        setTelefone(data.telefone);
        setOrigem(data.origem);
        setStatus(data.status);
        setMotivoPerda(data.motivoPerda || '');
        setNomeProjeto(data.nome ? `Projeto ${data.nome}` : '');
        setDescricaoProjeto(data.descricaoProjeto || '');
        setObservacoes(data.observacoes || '');
        setEndereco(data.endereco || '');
        setLinkOrcamento(data.linkOrcamento || '');
        setLinkProjeto3d(data.linkProjeto3d || '');
        setDataUltimoContato(data.dataUltimoContato ? data.dataUltimoContato.slice(0, 10) : '');
      })
      .catch(() => setLead(null));
  }, [id]);

  async function handleSave() {
    setErro('');
    setLoading(true);
    if (status === 'PERDIDO' && !motivoPerda.trim()) {
      setErro('Informe o motivo da perda.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email: email || undefined,
          telefone,
          origem,
          status,
          motivoPerda: motivoPerda || undefined,
          descricaoProjeto: descricaoProjeto || undefined,
          observacoes: observacoes || undefined,
          endereco: endereco || undefined,
          linkOrcamento: linkOrcamento || undefined,
          linkProjeto3d: linkProjeto3d || undefined,
          dataUltimoContato: dataUltimoContato || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error?.message || data.error || 'Erro ao salvar');
        setLoading(false);
        return;
      }
      setLead({ ...data, atividades: data.atividades ?? lead?.atividades });
      setEdit(false);
      toast.showSuccess('Lead salvo.');
      router.refresh();
    } catch {
      setErro('Erro ao salvar');
    }
    setLoading(false);
  }

  async function handleConverter() {
    setErro('');
    setLoading(true);
    const valor = valorTotal ? parseFloat(valorTotal) : undefined;
    const custoMat = custoMateriais ? parseFloat(custoMateriais) : undefined;
    const custoMao = custoMaoObra ? parseFloat(custoMaoObra) : undefined;
    const margem = margemPct ? parseFloat(margemPct) : undefined;
    const qtd = qtdChapasMdf ? parseInt(qtdChapasMdf, 10) : undefined;
    if (!nomeProjeto.trim()) {
      setErro('Nome do projeto é obrigatório.');
      setLoading(false);
      return;
    }
    if (!valor && (custoMat == null || custoMao == null || margem == null)) {
      setErro('Informe valor total ou custos + margem.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/leads/${id}/converter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeProjeto: nomeProjeto.trim(),
          valorTotal: valor,
          custoMateriais: custoMat,
          custoMaoObra: custoMao,
          margemPct: margem,
          qtdChapasMdf: qtd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao criar projeto');
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

  async function handleExcluirLead(excluirProjetos: boolean) {
    setErro('');
    setExcluindoLead(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluirProjetos }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao excluir');
        setExcluindoLead(false);
        setShowExcluirModal(false);
        return;
      }
      toast.showSuccess('Lead excluído.');
      router.push('/leads');
      router.refresh();
    } catch {
      setErro('Erro ao excluir');
      setExcluindoLead(false);
      setShowExcluirModal(false);
    }
  }

  if (!lead) {
    return (
      <div className="card">
        <p>Lead não encontrado ou carregando...</p>
        <Link href="/leads" className="btn-primary mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-slate-600 hover:text-slate-900">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{lead.nome}</h1>
        </div>
        {!edit ? (
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEdit(true)}>
              Editar
            </button>
            <button
              type="button"
              className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              onClick={() => {
                if ((lead.projetos?.length ?? 0) > 0) setShowExcluirModal(true);
                else if (confirm('Excluir este lead?')) handleExcluirLead(false);
              }}
            >
              Excluir lead
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEdit(false)}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        {edit ? (
          <>
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                type="tel"
                className="input"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Origem</label>
              <select className="input" value={origem} onChange={(e) => setOrigem(e.target.value)}>
                <option value="INDICACAO">Indicação</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="ARQUITETO">Arquiteto</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="SITE">Site</option>
                <option value="AMIGO">Amigo</option>
                <option value="FAMILIAR">Familiar</option>
                <option value="PARCEIRO">Parceiro</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Descrição do projeto</label>
              <input type="text" className="input" value={descricaoProjeto} onChange={(e) => setDescricaoProjeto(e.target.value)} placeholder="Ex: Cozinha completa" />
            </div>
            <div>
              <label className="label">Endereço (entrega/medição)</label>
              <input type="text" className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <label className="label">Link orçamento</label>
              <input type="url" className="input" value={linkOrcamento} onChange={(e) => setLinkOrcamento(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Link projeto 3D</label>
              <input type="url" className="input" value={linkProjeto3d} onChange={(e) => setLinkProjeto3d(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Último contato</label>
              <input type="date" className="input" value={dataUltimoContato} onChange={(e) => setDataUltimoContato(e.target.value)} />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input min-h-[80px]" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Notas gerais" />
            </div>
            {status === 'PERDIDO' && (
              <div>
                <label className="label">Motivo da perda *</label>
                <select
                  className="input"
                  value={MOTIVOS_PERDA.includes(motivoPerda) ? motivoPerda : 'Outro'}
                  onChange={(e) =>
                    setMotivoPerda(e.target.value === 'Outro' ? '' : e.target.value)
                  }
                >
                  {MOTIVOS_PERDA.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {MOTIVOS_PERDA.includes(motivoPerda) ? null : (
                  <input
                    type="text"
                    className="input mt-1"
                    placeholder="Descreva o motivo"
                    value={motivoPerda}
                    onChange={(e) => setMotivoPerda(e.target.value)}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {lead.email && (
              <p><span className="font-medium text-slate-700">E-mail:</span> {lead.email}</p>
            )}
            <p className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Telefone:</span> {lead.telefone}
              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            </p>
            <p><span className="font-medium text-slate-700">Origem:</span> {ORIGEM[lead.origem] ?? lead.origem}</p>
            <p><span className="font-medium text-slate-700">Status:</span> {STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}</p>
            {lead.motivoPerda && (
              <p><span className="font-medium text-slate-700">Motivo perda:</span> {lead.motivoPerda}</p>
            )}
            {lead.descricaoProjeto && (
              <p><span className="font-medium text-slate-700">Descrição projeto:</span> {lead.descricaoProjeto}</p>
            )}
            {lead.endereco && (
              <p><span className="font-medium text-slate-700">Endereço:</span> {lead.endereco}</p>
            )}
            {lead.dataUltimoContato && (
              <p><span className="font-medium text-slate-700">Último contato:</span> {new Date(lead.dataUltimoContato).toLocaleDateString('pt-BR')}</p>
            )}
            {(lead.linkOrcamento || lead.linkProjeto3d) && (
              <p className="flex flex-wrap gap-2">
                {lead.linkOrcamento && (
                  <a href={lead.linkOrcamento} target="_blank" rel="noopener noreferrer" className="text-camarpe-600 hover:underline">Orçamento</a>
                )}
                {lead.linkProjeto3d && (
                  <a href={lead.linkProjeto3d} target="_blank" rel="noopener noreferrer" className="text-camarpe-600 hover:underline">Projeto 3D</a>
                )}
              </p>
            )}
            {lead.observacoes && (
              <p><span className="font-medium text-slate-700">Observações:</span> {lead.observacoes}</p>
            )}
            {lead.projetos && lead.projetos.length > 0 && (
              <p>
                {lead.projetos.length === 1 ? (
                  <Link href={`/projetos/${lead.projetos[0].id}`} className="text-camarpe-600 hover:underline">
                    Ver projeto →
                  </Link>
                ) : (
                  <span>
                    {lead.projetos.map((p) => (
                      <Link key={p.id} href={`/projetos/${p.id}`} className="text-camarpe-600 hover:underline mr-2">
                        {p.nome} →
                      </Link>
                    ))}
                  </span>
                )}
              </p>
            )}
          </>
        )}
        {erro && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erro}</p>
        )}
      </div>

      {showExcluirModal && (lead.projetos?.length ?? 0) > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !excluindoLead && setShowExcluirModal(false)}>
          <div className="card max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-4">
              Este lead tem <strong>{lead.projetos?.length}</strong> projeto(s). Deseja excluir os projetos também?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary bg-red-600 hover:bg-red-700"
                disabled={excluindoLead}
                onClick={() => handleExcluirLead(true)}
              >
                {excluindoLead ? 'Excluindo...' : 'Excluir lead e projetos'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={excluindoLead}
                onClick={() => setShowExcluirModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Histórico de atividades</h2>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setShowNovaAtividade((v) => !v)}
          >
            {showNovaAtividade ? 'Cancelar' : '+ Nova atividade'}
          </button>
        </div>
        {showNovaAtividade && (
          <form
            className="mb-4 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-slate-50/50 p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setSalvandoAtividade(true);
              try {
                const res = await fetch(`/api/leads/${id}/atividades`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tipo: novaAtividadeTipo, descricao: novaAtividadeDesc || undefined }),
                });
                const ativ = await res.json();
                if (res.ok && lead) {
                  setLead({
                    ...lead,
                    atividades: [ativ, ...(lead.atividades || [])],
                  });
                  setNovaAtividadeDesc('');
                  setShowNovaAtividade(false);
                }
              } finally {
                setSalvandoAtividade(false);
              }
            }}
          >
            <div>
              <label className="label text-xs">Tipo</label>
              <select
                className="input text-sm"
                value={novaAtividadeTipo}
                onChange={(e) => setNovaAtividadeTipo(e.target.value)}
              >
                {Object.entries(TIPO_ATIVIDADE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="label text-xs">Descrição (opcional)</label>
              <input
                type="text"
                className="input text-sm"
                value={novaAtividadeDesc}
                onChange={(e) => setNovaAtividadeDesc(e.target.value)}
                placeholder="Ex: Cliente pediu revisão do orçamento"
              />
            </div>
            <button type="submit" className="btn-primary text-sm" disabled={salvandoAtividade}>
              {salvandoAtividade ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}
        {lead.atividades && lead.atividades.length > 0 ? (
          <ul className="space-y-2">
            {lead.atividades.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-2 text-sm">
                <span className="font-medium text-slate-700">{TIPO_ATIVIDADE[a.tipo] ?? a.tipo}</span>
                {a.descricao && <span className="text-slate-600">{a.descricao}</span>}
                <span className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString('pt-BR')}
                  {a.usuario?.nome && ` · ${a.usuario.nome}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma atividade registrada.</p>
        )}
      </div>

      {(!lead.projetos?.length) && !showConverter && (
        <div className="card">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowConverter(true)}
          >
            Criar projeto a partir deste lead
          </button>
        </div>
      )}

      {showConverter && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-800">Criar projeto</h2>
          <div>
            <label className="label">Nome do projeto</label>
            <input
              type="text"
              className="input"
              value={nomeProjeto}
              onChange={(e) => setNomeProjeto(e.target.value)}
              placeholder="Ex: Projeto João Silva"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Valor total (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="Ou preencha custos + margem abaixo"
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
          <p className="text-sm text-slate-500">Ou calcule: custo materiais + mão de obra + margem %</p>
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={handleConverter}
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar projeto'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowConverter(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
