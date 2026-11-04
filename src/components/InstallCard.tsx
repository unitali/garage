import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { touchDevice, useInstall } from '../pwa';
import { avatarSmall, btn, cardRow, grow } from '../ui';

const DISMISSED_KEY = 'install-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Onde fica o "Instalar" no menu do navegador (quando não há botão). */
function MenuSteps() {
  return touchDevice ? (
    <>
      Toque no menu <b>⋮</b> do navegador e escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).
    </>
  ) : (
    <>
      Clique no ícone de instalar, à direita da barra de endereço, ou no menu <b>⋮</b> → <b>Transmitir, salvar e compartilhar</b> →{' '}
      <b>Instalar página como app</b>. Se já instalou, o menu mostra <b>Abrir no app</b>.
    </>
  );
}

/**
 * Convite para instalar o app.
 * - na tela inicial: só quando o navegador oferece; dá para dispensar (×) e não volta
 * - `persistent` (tela Mais): sempre que estiver no navegador, sem dispensar — é o caminho garantido
 */
export default function InstallCard({ className = '', persistent = false }: { className?: string; persistent?: boolean }) {
  const install = useInstall({ always: persistent });
  const [dismissed, setDismissed] = useState(() => !persistent && readDismissed());

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
      <span className={`${avatarSmall} text-brand`}>
        <Smartphone className="size-5" aria-hidden />
      </span>
      <span className={grow}>
        <strong>Instalar o app</strong>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {install.kind === 'ios' ? (
            <>
              No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
            </>
          ) : install.kind === 'menu' ? (
            <MenuSteps />
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
      {!persistent && (
        <button className="pb-0.5 pl-1 text-2xl leading-none text-slate-600 dark:text-slate-400" aria-label="Dispensar" onClick={dismiss}>
          ×
        </button>
      )}
    </div>
  );
}
