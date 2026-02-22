import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = bodySchema.parse(body);
    const successResponse = NextResponse.json({
      ok: true,
      message: 'Se o e-mail existir, você receberá o link para redefinir a senha.',
    });

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) {
      // Retorna a mesma resposta independente do motivo — evita enumeração de usuários
      return successResponse;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.tokenRecuperacaoSenha.deleteMany({ where: { usuarioId: usuario.id } });
    await prisma.tokenRecuperacaoSenha.create({
      data: { usuarioId: usuario.id, token, expiraEm },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/redefinir-senha?token=${token}`;
    // TODO: Enviar e-mail real com o link de recuperação
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] Link de recuperação de senha:', link);
    }
    return successResponse;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
