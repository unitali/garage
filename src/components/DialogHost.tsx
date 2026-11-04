import { useId, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useDialog, type DialogOptions } from '../dialog';
import { useModal } from '../hooks/useModal';
import { btn } from '../ui';

/** Desenha o pop-up aberto por ask()/notify() (montado uma vez, em main.tsx). */
export default function DialogHost() {
  const dialog = useDialog();
  // key: cada pop-up começa do zero (sem "Aguarde…" nem erro do anterior)
  return dialog ? <Dialog key={dialog.id} {...dialog} /> : null;
}

function Dialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  icon,
  action,
  errorText = 'Não foi possível concluir agora. Verifique a internet e tente de novo.',
  resolve,
}: DialogOptions & { resolve: (ok: boolean) => void }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const danger = tone === 'danger';
  const Icon = icon ?? (danger ? TriangleAlert : null);

  const close = () => !running && resolve(false);
  // excluir: o foco começa no lado seguro (Cancelar); aviso/confirmação simples: no botão principal
  const onKeyDown = useModal(panel, cancelLabel === null ? () => !running && resolve(true) : close, danger && cancelLabel !== null ? cancel : ok);

  async function confirm() {
    if (!action) return resolve(true);
    setRunning(true);
    setError('');
    try {
      await action();
      resolve(true);
    } catch (err) {
      console.error(err);
      setRunning(false);
      setError(errorText);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(15,23,42,.5)] p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={message ? `${id}-text` : undefined}
        className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100"
      >
        {Icon && (
          <span
            className={`mb-3 grid size-12 place-items-center rounded-full ${danger ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-brand-soft text-brand'}`}
          >
            <Icon className="size-6" aria-hidden />
          </span>
        )}
        <h2 id={`${id}-title`} className="text-lg font-bold break-words">
          {title}
        </h2>
        {message && (
          <div id={`${id}-text`} className="mt-2 flex flex-col gap-2 text-sm">
            {message}
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button ref={ok} type="button" className={`${btn(danger ? 'destructive' : 'primary')} w-full`} onClick={confirm} disabled={running}>
            {running ? 'Aguarde…' : confirmLabel}
          </button>
          {cancelLabel !== null && (
            <button ref={cancel} type="button" className={`${btn('default')} w-full`} onClick={close} disabled={running}>
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
