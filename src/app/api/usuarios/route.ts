import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

const roleEnum = ['COMERCIAL', 'PRODUCAO', 'GESTAO'] as const;

const createSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(roleEnum),
});

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(usuarios);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const body = await request.json();
    const data = createSchema.parse(body);
    const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existe) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail' }, { status: 400 });
    }
    const senhaHash = await bcrypt.hash(data.senha, 12);
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        role: data.role as Role,
      },
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    });
    return NextResponse.json(usuario);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
