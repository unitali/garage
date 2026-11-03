import { useState } from 'react';
import { login } from '../auth';
import { btn, error as errorText } from '../ui';
import FlagStripe from '../components/FlagStripe';
import logoUrl from '../assets/logo.png';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError('');
    setBusy(true);
    try {
      await login();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Não foi possível entrar. Tente de novo.');
        console.error(e);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <img src={logoUrl} alt="" className="h-24 w-auto" />
      <h1 className="text-3xl font-bold">
        Unitali <span className="text-brand">Garage</span>
      </h1>
      {/* contorno: no fundo claro o branco do meio sumiria */}
      <FlagStripe className="h-1.5 w-16 overflow-hidden rounded-full ring-1 ring-line" />
      <p className="mb-3 max-w-[300px] text-muted">Manutenções, abastecimentos e despesas dos seus veículos, sempre à mão.</p>
      <button className={btn('primary')} onClick={handleLogin} disabled={busy}>
        {busy ? 'Entrando…' : 'Entrar com Google'}
      </button>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
