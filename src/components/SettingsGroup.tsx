import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/** Card com linhas de opções; `title` (opcional) aparece pequeno acima. */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <h2 className="mx-1 mb-2 text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">{title}</h2>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs dark:shadow-none">
        {children}
      </ul>
    </section>
  );
}

/** Linha que abre uma tela; `detail` aparece em cinza à direita. */
export function SettingsLink({ to, icon: Icon, label, detail }: { to: string; icon: LucideIcon; label: string; detail?: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 px-4 py-3 active:bg-slate-100 dark:active:bg-slate-950">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <span className="flex-1 font-semibold">{label}</span>
        {detail && <span className="text-sm text-slate-600 dark:text-slate-400">{detail}</span>}
        <ChevronRight className="size-5 shrink-0 text-slate-600 dark:text-slate-400" />
      </Link>
    </li>
  );
}

/** Linha que executa uma ação (ex: sair); `danger` em vermelho. */
export function SettingsAction({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <li>
      <button type="button" className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-950 ${danger ? 'text-red-700 dark:text-red-400' : ''}`} onClick={onClick}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${danger ? 'bg-red-50 dark:bg-red-950' : 'bg-brand-soft text-brand'}`}>
          <Icon className="size-5" />
        </span>
        <span className="flex-1 font-semibold">{label}</span>
      </button>
    </li>
  );
}

