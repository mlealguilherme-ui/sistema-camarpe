'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProjetoDetalhe from './ProjetoDetalhe';

export default function ProjetoPage() {
  const params = useParams();
  const id = params.id as string;
  const [projeto, setProjeto] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projetos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setProjeto(null);
        else setProjeto(data);
        setLoading(false);
      })
      .catch(() => {
        setProjeto(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="card">Carregando...</p>;
  if (!projeto) {
    return (
      <div className="card">
        <p>Projeto não encontrado.</p>
        <Link href="/projetos" className="btn-primary mt-2 inline-block">
          Voltar
        </Link>
      </div>
    );
  }

  return <ProjetoDetalhe projeto={projeto} onUpdate={setProjeto} />;
}
