import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { parseCsv } from '@/lib/parseCsv';
import { Decimal } from '@prisma/client/runtime/library';
import type { OrigemLead, StatusLead, StatusProducao } from '@prisma/client';

function getStr(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.trim()] ?? '';
    if (v.trim()) return v.trim();
  }
  return '';
}

function parseValor(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

function parseData(s: string): Date | null {
  if (!s || !s.trim()) return null;
  // dd/mm/yyyy ou yyyy-mm-dd
  const d = s.trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
  if (br) return new Date(parseInt(br[3], 10), parseInt(br[2], 10) - 1, parseInt(br[1], 10));
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (iso) return new Date(d);
  // "janeiro/2026" -> primeiro dia do mês
  const mesAno = /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/(\d{4})$/i.exec(d);
  if (mesAno) {
    const meses: Record<string, number> = { janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11 };
    const m = meses[mesAno[1].toLowerCase()];
    if (m != null) return new Date(parseInt(mesAno[2], 10), m, 1);
  }
  return null;
}

function origemFromObs(obs: string): OrigemLead {
  const o = (obs || '').toLowerCase();
  if (o.includes('instagram')) return 'INSTAGRAM';
  if (o.includes('amigo')) return 'AMIGO';
  if (o.includes('familiar')) return 'FAMILIAR';
  if (o.includes('parceiro')) return 'PARCEIRO';
  if (o.includes('arquiteto')) return 'ARQUITETO';
  return 'INDICACAO';
}

function statusOrcamentoToLead(status: string): StatusLead {
  const s = (status || '').toLowerCase();
  if (s.includes('perdido')) return 'PERDIDO';
  if (s.includes('fechado')) return 'CONTRATO_ASSINADO';
  if (s.includes('follow-up')) return 'ORCAMENTO_ENVIADO';
  return 'LEAD';
}

function statusProducaoFromPlanilha(status: string): StatusProducao {
  const s = (status || '').toLowerCase();
  if (s.includes('entregue')) return 'ENTREGUE';
  if (s.includes('aguardando início')) return 'AGUARDANDO_ARQUIVOS';
  if (s.includes('pronto') && s.includes('entrega')) return 'INSTALACAO';
  if (s.includes('pausado')) return 'PAUSADO';
  if (s.includes('fita') || s.includes('borda')) return 'MONTAGEM';
  if (s.includes('fitagem')) return 'FITAGEM';
  return 'AGUARDANDO_ARQUIVOS';
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const formData = await request.formData();
    const userId = session.sub!;

    const clientesFile = formData.get('clientes') as File | null;
    const orcamentosFile = formData.get('orcamentos') as File | null;
    const producaoFile = formData.get('producao') as File | null;
    const financeiroFile = formData.get('financeiro') as File | null;

    const clientes = clientesFile ? parseCsv(await clientesFile.text()) : [];
    const orcamentos = orcamentosFile ? parseCsv(await orcamentosFile.text()) : [];
    const producao = producaoFile ? parseCsv(await producaoFile.text()) : [];
    const financeiro = financeiroFile ? parseCsv(await financeiroFile.text()) : [];

    const stats = { leadsCriados: 0, leadsAtualizados: 0, projetosCriados: 0, projetosAtualizados: 0, pagamentosCriados: 0, erros: [] as string[] };

    const nomeToLead = new Map<string, string>(); // nome normalizado -> leadId

    // 1. Clientes: criar/atualizar leads (telefone, email, endereço, origem)
    for (const row of clientes) {
      const nome = getStr(row, 'Nome do Cliente', 'Nome');
      if (!nome) continue;
      const key = nome.toLowerCase().normalize('NFD').replace(/\s+/g, ' ').trim();
      const telefone = getStr(row, 'Telefone / WhatsApp', 'Telefone') || 'Importado';
      const email = getStr(row, 'E-mail', 'Email') || null;
      const endereco = getStr(row, 'Endereço (p/ Entrega e Medição)', 'Endereço') || null;
      const origem = origemFromObs(getStr(row, 'Observações', 'Obs.'));

      const existing = await prisma.lead.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: { telefone, email: email || undefined, endereco: endereco || undefined, origem },
        });
        stats.leadsAtualizados++;
        nomeToLead.set(key, existing.id);
      } else {
        const lead = await prisma.lead.create({
          data: { nome, telefone, email, endereco, origem, createdById: userId },
        });
        stats.leadsCriados++;
        nomeToLead.set(key, lead.id);
      }
    }

    // 2. Orçamentos: criar/atualizar leads; se Fechado, criar projeto
    for (const row of orcamentos) {
      const nome = getStr(row, 'Nome do Cliente', 'Nome');
      if (!nome) continue;
      const key = nome.toLowerCase().normalize('NFD').replace(/\s+/g, ' ').trim();
      let leadId = nomeToLead.get(key);
      if (!leadId) {
        const lead = await prisma.lead.create({
          data: {
            nome,
            telefone: 'Importado',
            origem: 'INDICACAO',
            createdById: userId,
            descricaoProjeto: getStr(row, 'Descrição do Projeto') || undefined,
            observacoes: getStr(row, 'Observações') || undefined,
            linkOrcamento: getStr(row, 'Link - Orçamento') || undefined,
            linkProjeto3d: getStr(row, 'Link - Projeto 3D') || undefined,
            status: statusOrcamentoToLead(getStr(row, 'Status do Orçamento')),
            dataUltimoContato: parseData(getStr(row, 'Data do ultimo contato')) ?? undefined,
          },
        });
        leadId = lead.id;
        nomeToLead.set(key, leadId);
        stats.leadsCriados++;
      } else {
        const status = statusOrcamentoToLead(getStr(row, 'Status do Orçamento'));
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            descricaoProjeto: getStr(row, 'Descrição do Projeto') || undefined,
            observacoes: getStr(row, 'Observações') || undefined,
            linkOrcamento: getStr(row, 'Link - Orçamento') || undefined,
            linkProjeto3d: getStr(row, 'Link - Projeto 3D') || undefined,
            status,
            dataUltimoContato: parseData(getStr(row, 'Data do ultimo contato')) ?? undefined,
          },
        });
        stats.leadsAtualizados++;
      }

      if (statusOrcamentoToLead(getStr(row, 'Status do Orçamento')) === 'CONTRATO_ASSINADO') {
        const valorNum = parseValor(getStr(row, 'Valor Proposto'));
        const nomeProjeto = getStr(row, 'Descrição do Projeto') || nome;
        if (valorNum != null && valorNum > 0) {
          const jaTem = await prisma.projeto.findFirst({
            where: { leadId, nome: { equals: nomeProjeto, mode: 'insensitive' } },
          });
          if (!jaTem) {
            const valorDec = new Decimal(valorNum);
            const proj = await prisma.projeto.create({
              data: {
                leadId,
                nome: nomeProjeto,
                valorTotal: valorDec,
                valorEntradaPago: new Decimal(0),
                valorPendente: valorDec,
                linkOrcamento: getStr(row, 'Link - Orçamento') || undefined,
                linkProjeto3d: getStr(row, 'Link - Projeto 3D') || undefined,
                createdById: userId,
              },
            });
            await prisma.checklistCompras.create({ data: { projetoId: proj.id } });
            stats.projetosCriados++;
          }
        }
      }
    }

    // 3. Produção: criar/atualizar projetos; guardar idPlanilha -> projetoId
    const idPlanilhaToProjetoId = new Map<string, string>();
    for (const row of producao) {
      const idPlanilha = getStr(row, 'ID');
      const cliente = getStr(row, 'Cliente');
      const nomeProjeto = getStr(row, 'Descrição do Projeto', 'Descrição');
      if (!cliente || !nomeProjeto) continue;
      const key = cliente.toLowerCase().normalize('NFD').replace(/\s+/g, ' ').trim();
      let leadId = nomeToLead.get(key);
      if (!leadId) {
        const lead = await prisma.lead.create({
          data: { nome: cliente, telefone: 'Importado', origem: 'INDICACAO', createdById: userId },
        });
        leadId = lead.id;
        nomeToLead.set(key, leadId);
        stats.leadsCriados++;
      }
      const valorNum = parseValor(getStr(row, 'Valor do Projeto'));
      const valorTotal = valorNum != null && valorNum > 0 ? new Decimal(valorNum) : new Decimal(0);
      const statusProducao = statusProducaoFromPlanilha(getStr(row, 'Status Atual'));
      const dataInicio = parseData(getStr(row, 'Início (Produção)'));
      const prazoEntrega = getStr(row, 'Prazo (Entrega)');
      const dataEntrega = parseData(prazoEntrega);
      const isEntregue = statusProducao === 'ENTREGUE';

      let proj = await prisma.projeto.findFirst({
        where: { leadId, nome: { equals: nomeProjeto, mode: 'insensitive' } },
        select: { id: true },
      });
      if (proj) {
        await prisma.projeto.update({
          where: { id: proj.id },
          data: {
            statusProducao,
            dataInicioProducao: dataInicio ?? undefined,
            dataEntregaPrevista: dataEntrega && !isEntregue ? dataEntrega : undefined,
            dataEntregaReal: isEntregue && dataEntrega ? dataEntrega : undefined,
            valorTotal: valorNum != null && valorNum > 0 ? valorTotal : undefined,
            observacoes: getStr(row, 'Obs.') || undefined,
            linkOrcamento: getStr(row, 'Link - Orçamento') || undefined,
            linkProjeto3d: getStr(row, 'Link - Projeto 3D') || undefined,
            idPlanilhaProducao: idPlanilha || undefined,
            updatedById: userId,
          },
        });
        stats.projetosAtualizados++;
      } else {
        proj = await prisma.projeto.create({
          data: {
            leadId,
            nome: nomeProjeto,
            valorTotal,
            valorEntradaPago: new Decimal(0),
            valorPendente: valorTotal,
            statusProducao,
            dataInicioProducao: dataInicio ?? undefined,
            dataEntregaPrevista: dataEntrega && !isEntregue ? dataEntrega : undefined,
            dataEntregaReal: isEntregue && dataEntrega ? dataEntrega : undefined,
            observacoes: getStr(row, 'Obs.') || undefined,
            linkOrcamento: getStr(row, 'Link - Orçamento') || undefined,
            linkProjeto3d: getStr(row, 'Link - Projeto 3D') || undefined,
            idPlanilhaProducao: idPlanilha || undefined,
            createdById: userId,
          },
        });
        await prisma.checklistCompras.create({ data: { projetoId: proj.id } });
        stats.projetosCriados++;
      }
      if (idPlanilha) idPlanilhaToProjetoId.set(idPlanilha, proj.id);
    }

    // 4. Financeiro: criar pagamentos (vincular por ID PRODUÇÃO)
    for (const row of financeiro) {
      const idProducao = getStr(row, 'ID PRODUÇÃO', 'ID PRODUÇÃO');
      const valorNum = parseValor(getStr(row, 'Valor'));
      if (!valorNum || valorNum <= 0) continue;
      let projetoId: string | null = null;
      if (idProducao) projetoId = idPlanilhaToProjetoId.get(idProducao) ?? null;
      if (!projetoId) {
        const cliente = getStr(row, 'Cliente');
        const desc = getStr(row, 'Descrição do Pgto');
        const proj = await prisma.projeto.findFirst({
          where: {
            lead: { nome: { equals: cliente, mode: 'insensitive' } },
            nome: { contains: desc.split(' ')[0], mode: 'insensitive' },
          },
          select: { id: true },
        });
        projetoId = proj?.id ?? null;
      }
      if (!projetoId) {
        stats.erros.push(`Financeiro: projeto não encontrado para "${getStr(row, 'Cliente')}" / ${getStr(row, 'Descrição do Pgto')}`);
        continue;
      }
      const statusPagto = (getStr(row, 'Status Pagto') || '').toLowerCase();
      const dataReceb = parseData(getStr(row, 'Data Recebimento'));
      const dataVenc = parseData(getStr(row, 'Data Vencimento'));
      const tipo = (getStr(row, 'Descrição do Pgto') || '').toLowerCase().includes('entrada') ? 'ENTRADA' : 'FINAL';

      await prisma.pagamento.create({
        data: {
          projetoId,
          valor: new Decimal(valorNum),
          tipo,
          data: dataReceb ?? undefined,
          dataVencimento: dataVenc ?? undefined,
          observacao: getStr(row, 'Descrição do Pgto') || undefined,
          linkComprovante: getStr(row, 'Link - Comp/NF') || undefined,
        },
      });
      stats.pagamentosCriados++;

      if (dataReceb) {
        const projeto = await prisma.projeto.findUnique({ where: { id: projetoId }, select: { valorEntradaPago: true, valorPendente: true } });
        if (projeto) {
          const v = new Decimal(valorNum);
          const novoEntrada = tipo === 'ENTRADA' ? new Decimal(projeto.valorEntradaPago).add(v) : projeto.valorEntradaPago;
          const novoPendente = new Decimal(projeto.valorPendente).sub(v);
          if (novoPendente.lessThan(0)) continue;
          await prisma.projeto.update({
            where: { id: projetoId },
            data: {
              valorEntradaPago: novoEntrada,
              valorPendente: novoPendente,
              ...(tipo === 'FINAL' ? { dataPagamentoFinalPrevista: null } : {}),
            },
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Importação concluída.',
      ...stats,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro na importação';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}