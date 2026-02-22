import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; arquivoId: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN']);
    const { id: projetoId, arquivoId } = await params;
    const arquivo = await prisma.arquivo.findFirst({
      where: { id: arquivoId, projetoId },
    });
    if (!arquivo) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    const fullPath = path.join(UPLOAD_DIR, arquivo.caminho);
    try {
      const buffer = await readFile(fullPath);
      const ext = path.extname(arquivo.nomeOriginal).toLowerCase();
      const types: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.gcode': 'text/plain',
        '.nc': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.skp': 'application/octet-stream',
      };
      const contentType = types[ext] || 'application/octet-stream';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(arquivo.nomeOriginal)}"`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Arquivo não encontrado no disco' }, { status: 404 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; arquivoId: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id: projetoId, arquivoId } = await params;
    const arquivo = await prisma.arquivo.findFirst({
      where: { id: arquivoId, projetoId },
    });
    if (!arquivo) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    const fullPath = path.join(UPLOAD_DIR, arquivo.caminho);
    try {
      await unlink(fullPath);
    } catch {
      // ignore if file already missing
    }
    await prisma.arquivo.delete({ where: { id: arquivoId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
