import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { encrypt } from '@/lib/encrypt';
import { z } from 'zod';

const createSchema = z.object({
  categoria: z.string().min(1),
  servico: z.string().min(1),
  login: z.string().optional().nullable(),
  senha: z.string().min(1),
});

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const list = await prisma.credencialAcesso.findMany({
      orderBy: [{ categoria: 'asc' }, { servico: 'asc' }],
    });
    return NextResponse.json(
      list.map((c) => ({
        id: c.id,
        categoria: c.categoria,
        servico: c.servico,
        login: c.login,
        senhaCriptografada: '[PROTEGIDO]',
      }))
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const created = await prisma.credencialAcesso.create({
      data: {
        categoria: data.categoria,
        servico: data.servico,
        login: data.login ?? null,
        senhaCriptografada: encrypt(data.senha),
      },
    });
    return NextResponse.json({
      id: created.id,
      categoria: created.categoria,
      servico: created.servico,
      login: created.login,
      senhaCriptografada: '[PROTEGIDO]',
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
