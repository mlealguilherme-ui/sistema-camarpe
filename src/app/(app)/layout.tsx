import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Layout from '@/components/Layout';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <Layout usuario={{ nome: session.nome, role: session.role }}>
      {children}
    </Layout>
  );
}
