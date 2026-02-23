'use client';

import { useState, useEffect } from 'react';

export default function PushNotifyPrompt() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
    setPermission(Notification.permission);
  }, []);

  async function handleEnable() {
    if (!supported || permission === 'granted') return;
    setStatus('loading');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setStatus('idle');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const resKey = await fetch('/api/push/vapid-public', { credentials: 'include' });
      if (!resKey.ok) throw new Error('Chave push indisponível');
      const { publicKey } = await resKey.json();
      if (!publicKey) throw new Error('Chave não configurada');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64Url(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64Url(sub.getKey('auth')!),
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao registrar');
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }

  if (!supported || permission === 'granted') return null;
  if (permission === 'denied') {
    return (
      <p className="text-sm text-slate-500">
        Notificações bloqueadas. Ative nas configurações do navegador para receber avisos no celular.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-3">
      <p className="mb-2 text-sm text-navy-800">
        Receba avisos (pagamentos, leads, contas a vencer) no celular.
      </p>
      <button
        type="button"
        className="btn-primary text-sm"
        onClick={handleEnable}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Ativando...' : status === 'ok' ? 'Ativado' : 'Ativar notificações'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">Não foi possível ativar. Tente de novo ou verifique as configurações.</p>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
