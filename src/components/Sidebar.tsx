'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Factory,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const roleLabels: Record<Role, string> = {
  COMERCIAL: 'Comercial',
  PRODUCAO: 'Produção',
  GESTAO: 'Gestão',
  ADMIN: 'Administrador',
};

const linksByRole: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  COMERCIAL: [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads / CRM', icon: Users },
    { href: '/projetos', label: 'Projetos', icon: FolderKanban },
    { href: '/producao', label: 'Produção', icon: Factory },
    { href: '/compras', label: 'Estoque', icon: Package },
  ],
  PRODUCAO: [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/producao', label: 'Produção', icon: Factory },
  ],
  GESTAO: [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/leads', label: 'Funil de Vendas', icon: Users },
    { href: '/projetos', label: 'Projetos / Financeiro', icon: FolderKanban },
    { href: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: BarChart3 },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/projetos', label: 'Projetos', icon: FolderKanban },
    { href: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: BarChart3 },
    { href: '/credenciais', label: 'Credenciais', icon: Package },
  ],
};

export function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = linksByRole[user.role] ?? linksByRole.COMERCIAL;

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-camarpe-primary text-white"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-camarpe-primary text-white flex flex-col
          transform transition-transform md:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Camarpe</h2>
          <p className="text-sm text-white/80">{user.name}</p>
          <p className="text-xs text-white/60">{roleLabels[user.role]}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition
                ${pathname === href ? 'bg-white/20' : 'hover:bg-white/10'}
              `}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-white/10 transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>
      {open && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/50 z-30 md:hidden cursor-default"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          aria-label="Fechar menu"
        />
      )}
    </>
  );
}
