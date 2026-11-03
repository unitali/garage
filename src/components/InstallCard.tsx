import { useState } from 'react';
import { useInstall } from '../pwa';
import { avatarSmall, btn, cardRow, grow } from '../ui';

const DISMISSED_KEY = 'install-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function InstallCard({ className = '' }: { className?: string }) {
  const install = useInstall();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!install || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // sem storage: some só nesta sessão
    }
  }

  return (
    <div className={`${cardRow} ${className}`}>
      <span className={avatarSmall}>📲</span>
      <span className={grow}>
        <strong>Instalar o app</strong>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {install.kind === 'ios' ? (
            <>
              No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
            </>
          ) : (
            'Abre direto da tela inicial e funciona sem internet.'
          )}
        </span>
      </span>
      {install.kind === 'prompt' && (
        <button className={btn('primary', 'sm')} onClick={install.install}>
          Instalar
        </button>
      )}
      <button className="pb-0.5 pl-1 text-2xl leading-none text-slate-600 dark:text-slate-400" aria-label="Dispensar" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
