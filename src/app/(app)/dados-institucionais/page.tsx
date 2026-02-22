import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DadosInstitucionaisClient from './DadosInstitucionaisClient';
import { prisma } from '@/lib/prisma';

export default async function DadosInstitucionaisPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GESTAO' && session.role !== 'ADMIN') redirect('/dashboard');
  const row = await prisma.dadosInstitucionais.findFirst({ orderBy: { updatedAt: 'desc' } });
  const initial = row
    ? {
        cnpj: row.cnpj ?? '',
        endereco: row.endereco ?? '',
        telefone: row.telefone ?? '',
        site: row.site ?? '',
        instagram: row.instagram ?? '',
      }
    : { cnpj: '', endereco: '', telefone: '', site: '', instagram: '' };
  return <DadosInstitucionaisClient initial={initial} />;
}
