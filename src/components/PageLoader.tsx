'use client';

import Link from 'next/link';

/**
 * Skeleton de carregamento para listas e páginas.
 */
export function PageLoader() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="h-6 w-1/3 rounded bg-slate-200" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/**
 * Mensagem e ação quando a lista está vazia.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <Link href={actionHref} className="btn-primary mt-4 inline-block">
        {actionLabel}
      </Link>
    </div>
  );
}
