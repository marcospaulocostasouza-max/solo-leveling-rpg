'use client';

import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function enter() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/consume', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Token inválido.');
      window.location.assign('/personagem');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível validar o token.');
    } finally { setLoading(false); }
  }

  return <main className="login-page"><section className="login-card"><ShieldCheck/><small>PORTAL DO CAÇADOR</small><h1>Acesso pelo WhatsApp</h1><p>Envie <b>!site</b> ao bot. O link privado usa um token temporário de uso único.</p><label><span>Token de acesso</span><div><KeyRound/><input value={token} onChange={e=>setToken(e.target.value)} placeholder="Token recebido no privado"/></div></label><button onClick={enter} disabled={!token.trim() || loading}>{loading ? 'VALIDANDO...' : 'ENTRAR NO SISTEMA'}</button>{error && <em>{error}</em>}<em>O token não é salvo no navegador e é invalidado após o primeiro uso.</em></section></main>;
}

export default function Login() { return <LoginForm/>; }
