'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

function validarCNPJ(val: string): string | null {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length !== 14) return 'CNPJ deve ter 14 dígitos.';
  if (/^(\d)\1+$/.test(digits)) return 'CNPJ inválido.';
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum1 = w1.reduce((s, w, i) => s + parseInt(digits[i], 10) * w, 0);
  const d1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (d1 !== parseInt(digits[12], 10)) return 'CNPJ inválido (dígito verificador).';
  const sum2 = w2.reduce((s, w, i) => s + parseInt(digits[i], 10) * w, 0);
  const d2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  if (d2 !== parseInt(digits[13], 10)) return 'CNPJ inválido (dígito verificador).';
  return null;
}

function validarURL(val: string): string | null {
  const s = val.trim();
  if (!s) return null;
  try {
    const url = s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
    new URL(url);
    return null;
  } catch {
    return 'Informe uma URL válida (ex: grupocamarpe.com.br ou https://...).';
  }
}

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
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const toast = useToast();

  const onCnpjBlur = useCallback(() => {
    setCnpjError(cnpj.trim() ? validarCNPJ(cnpj) : null);
  }, [cnpj]);

  const onSiteBlur = useCallback(() => {
    setSiteError(site.trim() ? validarURL(site) : null);
  }, [site]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const errCnpj = cnpj.trim() ? validarCNPJ(cnpj) : null;
    const errSite = site.trim() ? validarURL(site) : null;
    setCnpjError(errCnpj);
    setSiteError(errSite);
    if (errCnpj || errSite) return;
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
          <input
            type="text"
            className="input"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            onBlur={onCnpjBlur}
            placeholder="54.162.932/0001-60"
            aria-invalid={!!cnpjError}
          />
          {cnpjError && <p className="mt-1 text-sm text-red-600">{cnpjError}</p>}
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
          <input
            type="text"
            className="input"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            onBlur={onSiteBlur}
            placeholder="grupocamarpe.com.br"
            aria-invalid={!!siteError}
          />
          {siteError && <p className="mt-1 text-sm text-red-600">{siteError}</p>}
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
