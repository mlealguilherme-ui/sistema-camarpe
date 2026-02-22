import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const row = await prisma.dadosInstitucionais.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!row) {
      return NextResponse.json({
        id: null,
        cnpj: null,
        endereco: null,
        telefone: null,
        site: null,
        instagram: null,
      });
    }
    return NextResponse.json({
      id: row.id,
      cnpj: row.cnpj,
      endereco: row.endereco,
      telefone: row.telefone,
      site: row.site,
      instagram: row.instagram,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const body = await request.json();
    const { cnpj, endereco, telefone, site, instagram } = body;

    const existing = await prisma.dadosInstitucionais.findFirst();
    const data = {
      cnpj: cnpj ?? undefined,
      endereco: endereco ?? undefined,
      telefone: telefone ?? undefined,
      site: site ?? undefined,
      instagram: instagram ?? undefined,
    };

    if (existing) {
      const updated = await prisma.dadosInstitucionais.update({
        where: { id: existing.id },
        data,
      });
      return NextResponse.json(updated);
    }
    const created = await prisma.dadosInstitucionais.create({ data });
    return NextResponse.json(created);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
