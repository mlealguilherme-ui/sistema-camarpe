import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = bodySchema.parse(body);
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 });
    }
    if (!usuario.ativo) {
      return NextResponse.json({ error: 'Conta desativada. Entre em contato com a gestão.' }, { status: 403 });
    }
    const ok = await bcrypt.compare(senha, usuario.senhaHash);
    if (!ok) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 });
    }
    const token = await signToken({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      nome: usuario.nome,
    });
    await setAuthCookie(token);
    return NextResponse.json({
      usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
