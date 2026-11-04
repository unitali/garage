import { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useModal } from '../hooks/useModal';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** abre acima da barra de baixo (que continua visível): o painel termina em cima dela */
  aboveNav?: boolean;
}

/**
 * Painel que sobe de baixo (ex: "Adicionar", calculadora no abastecimento).
 * Fecha com Esc, com o X ou tocando fora; o foco fica preso dentro e a página de trás não rola.
 */
export default function Sheet({ open, ...props }: Props) {
  return open ? <Panel {...props} /> : null;
}

function Panel({ onClose, title, subtitle, children, aboveNav = false }: Omit<Props, 'open'>) {
  const sheet = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onKeyDown = useModal(sheet, onClose);

  return (
    <div
      // barra de baixo: 64px + área segura (mesma altura do BottomNav)
      className={`fixed inset-x-0 top-0 z-40 flex items-end bg-[rgba(15,23,42,.5)] ${aboveNav ? 'bottom-[calc(64px+env(safe-area-inset-bottom))]' : 'bottom-0'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
    >
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`mx-auto max-h-[90%] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100 ${aboveNav ? 'pb-6' : 'pb-[calc(16px+env(safe-area-inset-bottom))]'}`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" className="grid size-11 place-items-center rounded-xl text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-950" aria-label="Fechar" onClick={onClose}>
            <X className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
