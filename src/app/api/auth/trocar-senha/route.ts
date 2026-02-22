import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const bodySchema = z.object({
  senhaAtual: z.string().min(1),
  senhaNova: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { senhaAtual, senhaNova } = bodySchema.parse(body);
    const usuario = await prisma.usuario.findUnique({ where: { id: session.sub } });
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }
    const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }
    const senhaHash = await bcrypt.hash(senhaNova, 12);
    await prisma.usuario.update({
      where: { id: session.sub },
      data: { senhaHash },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Senha nova deve ter no mínimo 6 caracteres' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
