import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const bodySchema = z.object({
  token: z.string().min(1),
  senha: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, senha } = bodySchema.parse(body);
    const rec = await prisma.tokenRecuperacaoSenha.findUnique({
      where: { token },
      include: { usuario: true },
    });
    if (!rec || rec.expiraEm < new Date()) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Solicite um novo.' }, { status: 400 });
    }
    const senhaHash = await bcrypt.hash(senha, 12);
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: rec.usuarioId },
        data: { senhaHash },
      }),
      prisma.tokenRecuperacaoSenha.delete({ where: { id: rec.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
