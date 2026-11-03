import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/** Card com linhas de opções; `title` (opcional) aparece pequeno acima. */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <h2 className="mx-1 mb-2 text-xs font-bold tracking-wider text-muted uppercase">{title}</h2>}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-xs dark:shadow-none">
        {children}
      </ul>
    </section>
  );
}

/** Linha que abre uma tela; `detail` aparece em cinza à direita. */
export function SettingsLink({ to, icon: Icon, label, detail }: { to: string; icon: LucideIcon; label: string; detail?: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 px-4 py-3 active:bg-bg">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <span className="flex-1 font-semibold">{label}</span>
        {detail && <span className="text-sm text-muted">{detail}</span>}
        <ChevronRight className="size-5 shrink-0 text-muted" />
      </Link>
    </li>
  );
}

/** Linha só informativa (ex: versão). */
export function SettingsInfo({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-5" />
      </span>
      <span className="flex-1 font-semibold">{label}</span>
      <span className="text-sm text-muted">{value}</span>
    </li>
  );
}
