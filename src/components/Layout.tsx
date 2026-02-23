'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/Toast';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Factory,
  Package,
  Wallet,
  Phone,
  Building2,
  KeyRound,
  UserCog,
  LogOut,
  Menu,
  X,
  Upload,
  Lightbulb,
} from 'lucide-react';

type Role = 'COMERCIAL' | 'PRODUCAO' | 'GESTAO' | 'ADMIN';

const ROLE_LABEL: Record<Role, string> = {
  COMERCIAL: 'Comercial',
  PRODUCAO: 'Produção',
  GESTAO: 'Gestão',
  ADMIN: 'Administrador',
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navComercial: NavGroup[] = [
  { label: 'Início', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Vendas', items: [{ href: '/leads', label: 'Leads', icon: Users }, { href: '/projetos', label: 'Projetos', icon: FolderKanban }] },
  { label: 'Operação', items: [{ href: '/producao', label: 'Produção', icon: Factory }, { href: '/compras', label: 'Estoque', icon: Package }] },
  { label: 'Suporte', items: [{ href: '/telefones-uteis', label: 'Telefones úteis', icon: Phone }, { href: '/sugestoes', label: 'Sugestões', icon: Lightbulb }] },
];

const navProducao: NavGroup[] = [
  { label: 'Início', items: [{ href: '/producao', label: 'Produção', icon: Factory }] },
  { label: 'Suporte', items: [{ href: '/telefones-uteis', label: 'Telefones úteis', icon: Phone }, { href: '/sugestoes', label: 'Sugestões', icon: Lightbulb }] },
];

const navGestao: NavGroup[] = [
  { label: 'Início', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Vendas', items: [{ href: '/leads', label: 'Leads', icon: Users }, { href: '/projetos', label: 'Projetos', icon: FolderKanban }] },
  { label: 'Operação', items: [{ href: '/producao', label: 'Produção', icon: Factory }, { href: '/compras', label: 'Estoque', icon: Package }] },
  { label: 'Financeiro', items: [{ href: '/fluxo-caixa', label: 'Fluxo de caixa', icon: Wallet }] },
  { label: 'Suporte', items: [{ href: '/telefones-uteis', label: 'Telefones úteis', icon: Phone }, { href: '/sugestoes', label: 'Sugestões', icon: Lightbulb }] },
  { label: 'Configuração', items: [{ href: '/dados-institucionais', label: 'Dados da empresa', icon: Building2 }, { href: '/usuarios', label: 'Usuários', icon: UserCog }] },
];

const navAdmin: NavGroup[] = [
  { label: 'Início', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Vendas', items: [{ href: '/leads', label: 'Leads', icon: Users }, { href: '/projetos', label: 'Projetos', icon: FolderKanban }] },
  { label: 'Operação', items: [{ href: '/producao', label: 'Produção', icon: Factory }, { href: '/compras', label: 'Estoque', icon: Package }] },
  { label: 'Financeiro', items: [{ href: '/fluxo-caixa', label: 'Fluxo de caixa', icon: Wallet }] },
  { label: 'Suporte', items: [{ href: '/telefones-uteis', label: 'Telefones úteis', icon: Phone }, { href: '/sugestoes', label: 'Sugestões', icon: Lightbulb }] },
  { label: 'Configuração', items: [{ href: '/dados-institucionais', label: 'Dados da empresa', icon: Building2 }, { href: '/credenciais', label: 'Credenciais', icon: KeyRound }, { href: '/importar', label: 'Importar planilhas', icon: Upload }, { href: '/usuarios', label: 'Usuários', icon: UserCog }] },
];

interface LayoutProps {
  children: React.ReactNode;
  usuario: { nome: string; role: Role };
}

export default function Layout({ children, usuario }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navGroups: NavGroup[] =
    usuario.role === 'ADMIN'
      ? navAdmin
      : usuario.role === 'COMERCIAL'
        ? navComercial
        : usuario.role === 'GESTAO'
          ? navGestao
          : navProducao;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar - azul escuro da marca (logo Grupo Camarpe) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-navy-800 text-white
          transition-transform duration-200 ease-out
          lg:static lg:translate-x-0 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-14 items-center justify-between border-b border-navy-700 px-4 lg:justify-center">
          <Link href="/dashboard" className="font-script text-2xl font-semibold tracking-wide text-camarpe-400" onClick={() => setSidebarOpen(false)}>
            Camarpe
          </Link>
          <button
            type="button"
            className="rounded p-2 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-4 px-2">
            {navGroups.map((group) => (
              <li key={group.label}>
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                            ${isActive
                              ? 'bg-camarpe-500 text-slate-900'
                              : 'text-slate-300 hover:bg-navy-700 hover:text-white'}
                          `}
                        >
                          <Icon size={20} className="flex-shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-navy-700 p-2">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-navy-700 hover:text-white"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar"
        />
      )}

      {/* Conteúdo principal + top bar */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <button
            type="button"
            className="rounded p-2 text-slate-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{ROLE_LABEL[usuario.role] ?? usuario.nome}</span>
            <Link
              href="/trocar-senha"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Trocar senha
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
    </ToastProvider>
  );
}

function Footer() {
  const [dados, setDados] = useState<{ telefone?: string | null; site?: string | null; instagram?: string | null } | null>(null);
  useEffect(() => {
    fetch('/api/dados-institucionais')
      .then((r) => r.json())
      .then((d) => (d.error ? null : setDados(d)))
      .catch(() => {});
  }, []);
  if (!dados || (!dados.telefone && !dados.site && !dados.instagram)) return null;
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500">
      {dados.telefone && (
        <span className="mr-4">
          <a href={`https://wa.me/55${dados.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-camarpe-500">
            {dados.telefone}
          </a>
        </span>
      )}
      {dados.site && (
        <a href={dados.site.startsWith('http') ? dados.site : `https://${dados.site}`} target="_blank" rel="noopener noreferrer" className="mr-4 hover:text-camarpe-500">
          {dados.site}
        </a>
      )}
      {dados.instagram && (
        <a href={`https://instagram.com/${dados.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-camarpe-500">
          {dados.instagram}
        </a>
      )}
    </footer>
  );
}
