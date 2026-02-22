import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { TipoArquivo } from '@prisma/client';

const UPLOAD_DIR = process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads'));
const TIPOS_ALLOWED: TipoArquivo[] = ['GCODE', 'TRES_D', 'PDF_CORTE', 'CONTRATO'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id: projetoId } = await params;
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string | null;
    if (!file || !tipo || !TIPOS_ALLOWED.includes(tipo as TipoArquivo)) {
      return NextResponse.json(
        { error: 'Envie um arquivo e o tipo (GCODE, TRES_D, PDF_CORTE, CONTRATO)' },
        { status: 400 }
      );
    }
    const nomeOriginal = file.name;
    const ext = path.extname(nomeOriginal) || path.extname(file.name);
    const dirProjeto = path.join(UPLOAD_DIR, projetoId);
    await mkdir(dirProjeto, { recursive: true });
    const filename = `${tipo}_${randomUUID()}${ext}`;
    const filepath = path.join(dirProjeto, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));
    const caminho = path.join(projetoId, filename);
    const arquivo = await prisma.arquivo.create({
      data: {
        projetoId,
        tipo: tipo as TipoArquivo,
        nomeOriginal,
        caminho,
      },
    });
    return NextResponse.json(arquivo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, message: detail }, { status });
  }
}
