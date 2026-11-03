import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { markPaid } from '../db';
import { isPaid, resumoDaSerie } from '../lib/summary';
import { brl, date } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry } from '../types';
import { btn, card, iconCircle, KIND_ICON, KIND_SOFT } from '../ui';

const Icon = KIND_ICON.expense;

/** Despesa parcelada/recorrente: progresso das parcelas; tocando, lista cada uma (com "Pago" nas em aberto). */
export default function SeriesCard({ uid, vid, parcelas }: { uid: string; vid: string; parcelas: Entry[] }) {
  const [open, setOpen] = useState(false);
  const r = resumoDaSerie(parcelas);
  const first = r.parcelas[0];
  const valor = r.proxima?.amount ?? first.amount;
  const recurring = first.series?.type === 'recurring';
  const pct = r.total ? Math.round((r.pagas / r.total) * 100) : 0;

  return (
    <div className={card}>
      <button className="flex min-h-11 w-full items-start gap-3 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={`${iconCircle} ${KIND_SOFT.expense}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="break-words">
            {first.category}
            {recurring ? ' · recorrente' : ''}
          </strong>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {r.total}× {brl(valor)}
            {r.proxima ? ` · próxima ${date(r.proxima.date)}` : ' · quitado'}
          </span>
        </span>
        <ChevronDown className={`mt-2 size-5 shrink-0 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950"
        role="progressbar"
        aria-label="Parcelas pagas"
        aria-valuemin={0}
        aria-valuemax={r.total}
        aria-valuenow={r.pagas}
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span>
          <b>
            {r.pagas} de {r.total}
          </b>{' '}
          pagas · {brl(r.valorPago)}
        </span>
        <span className="text-slate-600 dark:text-slate-400">falta {brl(r.restante)}</span>
      </div>

      {open && (
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
          {r.parcelas.map((e) => {
            const paid = isPaid(e);
            return (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <Link to={paths.entry(vid, e.id)} className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="text-sm">
                    <b>{e.series?.index}ª</b> · {date(e.date)}
                    <span className={paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}> · {paid ? 'paga' : 'em aberto'}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{brl(e.amount)}</span>
                </Link>
                {!paid && (
                  <button type="button" className={`${btn('default', 'sm')} shrink-0 gap-1`} onClick={() => markPaid(uid, vid, e.id)}>
                    <Check className="size-4" aria-hidden />
                    Pago
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
