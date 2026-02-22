import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PwaRegister from '@/components/PwaRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Sistema Camarpe | Gestão',
  description: 'CRM, Projetos, Produção e Estoque',
  manifest: '/manifest.json',
  themeColor: '#1e3a5f',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
