import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SugestoesClient from './SugestoesClient';

export default async function SugestoesPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const podeAlterarStatus = session.role === 'GESTAO' || session.role === 'ADMIN';
  return <SugestoesClient podeAlterarStatus={podeAlterarStatus} />;
}
