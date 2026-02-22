import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CredenciaisClient from './CredenciaisClient';

export default async function CredenciaisPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return <CredenciaisClient />;
}
