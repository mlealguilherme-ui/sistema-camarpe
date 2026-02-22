'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function DadosInstitucionaisClient({
  initial,
}: {
  initial: { cnpj: string; endereco: string; telefone: string; site: string; instagram: string };
}) {
  const [cnpj, setCnpj] = useState(initial.cnpj);
  const [endereco, setEndereco] = useState(initial.endereco);
  const [telefone, setTelefone] = useState(initial.telefone);
  const [site, setSite] = useState(initial.site);
  const [instagram, setInstagram] = useState(initial.instagram);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    try {
      const res = await fetch('/api/dados-institucionais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: cnpj || null, endereco: endereco || null, telefone: telefone || null, site: site || null, instagram: instagram || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao salvar');
        setSaving(false);
        return;
      }
      toast.showSuccess('Salvo com sucesso.');
      setSaving(false);
    } catch {
      setErro('Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dados institucionais</h1>
      <p className="text-sm text-slate-500">Estes dados podem aparecer no rodapé do sistema.</p>
      <form onSubmit={handleSubmit} className="card max-w-xl space-y-4">
        <div>
          <label className="label">CNPJ</label>
          <input type="text" className="input" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="54.162.932/0001-60" />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input type="text" className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="R. Pedro da Costa Ribeiro, 496 - Montes Claros - MG" />
        </div>
        <div>
          <label className="label">Telefone / WhatsApp</label>
          <input type="text" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(38) 98809-7949" />
        </div>
        <div>
          <label className="label">Site oficial</label>
          <input type="text" className="input" value={site} onChange={(e) => setSite(e.target.value)} placeholder="grupocamarpe.com.br" />
        </div>
        <div>
          <label className="label">Instagram</label>
          <input type="text" className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@grupocamarpe" />
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}
