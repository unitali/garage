import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import { logout, useAuth } from '../auth';
import { deleteAccount } from '../db';
import { btn } from '../ui';

/** Botão "Excluir conta" + confirmação. Cancelar não faz nada; confirmar guarda uma cópia, apaga tudo e sai. */
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`${btn('destructive')} w-full`} onClick={() => setOpen(true)}>
        Excluir conta
      </button>
      {open && <ConfirmDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ConfirmDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancel.current?.focus(); // o foco começa no lado seguro
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const close = () => !running && onClose();

  async function confirm() {
    if (!user) return;
    setRunning(true);
    setError('');
    try {
      await deleteAccount(user.uid, { email: user.email, name: user.displayName });
      try {
        localStorage.removeItem('selected-vehicle');
      } catch {
        // sem storage: nada a limpar
      }
      await logout();
    } catch (err) {
      console.error(err);
      setRunning(false);
      setError('Não foi possível excluir agora. Verifique a internet e tente de novo — seus dados não foram perdidos.');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    // foco preso entre os botões do aviso
    const items = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    items[(i + (e.shiftKey ? items.length - 1 : 1)) % items.length]?.focus();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,.5)] p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-text"
        className="w-full max-w-sm rounded-3xl bg-surface p-5 text-ink shadow-2xl"
      >
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-danger-bg text-danger">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <h2 id="delete-title" className="text-lg font-bold">
          Excluir conta?
        </h2>
        <div id="delete-text" className="mt-2 flex flex-col gap-2 text-sm">
          <p>
            <b>Tudo será excluído</b>: veículos, abastecimentos, serviços, despesas, lembretes e suas configurações.
          </p>
          <p>Os dados serão perdidos e não será possível recuperá-los pelo app. Em seguida, você sai da conta.</p>
        </div>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" className={`${btn('destructive')} w-full`} onClick={confirm} disabled={running}>
            {running ? 'Excluindo…' : 'Excluir tudo'}
          </button>
          <button ref={cancel} type="button" className={`${btn('default')} w-full`} onClick={close} disabled={running}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
