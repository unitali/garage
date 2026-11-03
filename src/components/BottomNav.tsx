import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Ellipsis, House, List, Plus, type LucideIcon } from 'lucide-react';
import AddSheet from './AddSheet';
import { useGarage } from '../garage';
import { PATTERNS, paths } from '../routes/paths';

/**
 * Barra de baixo: Início, Histórico, + (abre o painel "Adicionar"), Lembretes (badge com os vencidos) e Mais.
 * Altura 64px + área segura; rótulos de 12px sem truncar.
 */
export default function BottomNav() {
  const { vehicle, current, entries, overdue } = useGarage();
  const { pathname } = useLocation();
  const [adding, setAdding] = useState(false);
  const plus = useRef<HTMLButtonElement>(null);

  // Mais e as telas que abrem a partir dele (/config/…)
  const inMore = [paths.more(), PATTERNS.settings].some((p) => pathname.startsWith(p));

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:border-x"
      >
        <ul className="grid h-16 grid-cols-5">
          <Item to={paths.home()} icon={House} label="Início" active={pathname === paths.home()} />
          <Item to={paths.history()} icon={List} label="Histórico" active={pathname.startsWith(paths.history())} />
          <li className="flex justify-center">
            <button
              ref={plus}
              className="flex flex-col items-center gap-0.5 text-xs font-medium text-muted"
              aria-haspopup="dialog"
              aria-expanded={adding}
              onClick={() => setAdding(true)}
            >
              {/* 56px, 24px acima da barra, borda de 4px na cor da superfície */}
              <span className="-mt-6 grid size-14 place-items-center rounded-full border-4 border-surface bg-brand text-brand-contrast shadow-lg">
                <Plus className="size-7" aria-hidden />
              </span>
              Adicionar
            </button>
          </li>
          <Item
            to={paths.reminders()}
            icon={Bell}
            label="Lembretes"
            active={pathname.startsWith(paths.reminders())}
            badge={overdue}
            badgeLabel={`${overdue} vencido${overdue === 1 ? '' : 's'}`}
          />
          <Item to={paths.more()} icon={Ellipsis} label="Mais" active={inMore} />
        </ul>
      </nav>

      <AddSheet
        open={adding}
        onClose={() => {
          setAdding(false);
          plus.current?.focus();
        }}
        vehicle={vehicle}
        odometer={current}
        entries={entries}
      />
    </>
  );
}

function Item({
  to,
  icon: Icon,
  label,
  active,
  badge = 0,
  badgeLabel,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
  badgeLabel?: string;
}) {
  return (
    <li className="flex">
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        aria-label={badge > 0 ? `${label}, ${badgeLabel}` : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs ${active ? 'font-bold text-brand' : 'font-medium text-muted'}`}
      >
        <span className="relative">
          <Icon className="size-6" aria-hidden />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-bg">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        {label}
      </Link>
    </li>
  );
}
