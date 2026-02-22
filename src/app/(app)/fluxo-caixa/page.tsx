import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FluxoCaixaClient from './FluxoCaixaClient';

export default async function FluxoCaixaPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'GESTAO' && session.role !== 'ADMIN') redirect('/dashboard');
  return <FluxoCaixaClient />;
}
