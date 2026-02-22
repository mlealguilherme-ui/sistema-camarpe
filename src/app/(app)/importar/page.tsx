import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportarClient from './ImportarClient';

export default async function ImportarPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return <ImportarClient />;
}
