import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const createSchema = z.object({
  nome: z.string().min(1),
  quantidadeMinima: z.number().int().min(0),
  quantidadeAtual: z.number().int().min(0).optional(),
  avisoAtivo: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const itens = await prisma.itemEstoqueAlerta.findMany({
      orderBy: { nome: 'asc' },
    });
    const alertas = itens.filter(
      (i) => i.avisoAtivo && i.quantidadeAtual < i.quantidadeMinima
    );
    return NextResponse.json({ itens, alertas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const item = await prisma.itemEstoqueAlerta.create({
      data: {
        nome: data.nome,
        quantidadeMinima: data.quantidadeMinima,
        quantidadeAtual: data.quantidadeAtual ?? 0,
        avisoAtivo: data.avisoAtivo ?? true,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
