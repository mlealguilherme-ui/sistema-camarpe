import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';

const TEMPLATES: Record<string, string> = {
  clientes: 'Nome do Cliente,Telefone / WhatsApp,E-mail,Endereço (p/ Entrega e Medição),Observações',
  orcamentos:
    'Nome do Cliente,Descrição do Projeto,Status do Orçamento,Valor Proposto,Link - Orçamento,Link - Projeto 3D,Observações,Data do ultimo contato',
  producao:
    'ID,Cliente,Descrição do Projeto,Status Atual,Início (Produção),Prazo (Entrega),Valor do Projeto',
  financeiro:
    'ID PRODUÇÃO,Cliente,Descrição do Pgto,Data Vencimento,Valor,Status Pagto,Data Recebimento,Link - Comp/NF',
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'clientes';
    const header = TEMPLATES[tipo];
    if (!header) {
      return NextResponse.json({ error: 'Tipo inválido. Use: clientes, orcamentos, producao, financeiro' }, { status: 400 });
    }
    const csv = header + '\n';
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="template-${tipo}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}
