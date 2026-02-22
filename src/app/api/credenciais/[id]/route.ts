import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encrypt';
import { z } from 'zod';

const updateSchema = z.object({
  categoria: z.string().min(1).optional(),
  servico: z.string().min(1).optional(),
  login: z.string().optional().nullable(),
  senha: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const { id } = await params;
    const c = await prisma.credencialAcesso.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    let senhaDecriptada: string | null = null;
    try {
      senhaDecriptada = decrypt(c.senhaCriptografada);
    } catch {
      // mantém null se falhar
    }
    return NextResponse.json({
      id: c.id,
      categoria: c.categoria,
      servico: c.servico,
      login: c.login,
      senha: senhaDecriptada,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);
    const update: { categoria?: string; servico?: string; login?: string | null; senhaCriptografada?: string } = {};
    if (data.categoria !== undefined) update.categoria = data.categoria;
    if (data.servico !== undefined) update.servico = data.servico;
    if (data.login !== undefined) update.login = data.login ?? null;
    if (data.senha !== undefined) update.senhaCriptografada = encrypt(data.senha);
    const updated = await prisma.credencialAcesso.update({
      where: { id },
      data: update,
    });
    return NextResponse.json({
      id: updated.id,
      categoria: updated.categoria,
      servico: updated.servico,
      login: updated.login,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['ADMIN']);
    const { id } = await params;
    await prisma.credencialAcesso.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
