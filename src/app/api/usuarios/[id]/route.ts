import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import type { Role } from '@prisma/client';

const roleEnum = ['COMERCIAL', 'PRODUCAO', 'GESTAO'] as const;

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  role: z.enum(roleEnum).optional(),
  ativo: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    });
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json(usuario);
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
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.role !== undefined && { role: data.role as Role }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(usuario);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
