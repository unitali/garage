import { Link } from 'react-router-dom';
import { ENTRY_KINDS } from '../constants';
import { brl, date, km, num } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry } from '../types';
import { KIND_BORDER, KIND_ICON, KIND_SOFT, card } from '../ui';

/** Card de um abastecimento, serviço ou despesa, na cor do tipo; `kml` é o consumo do trecho, quando houver. */
export default function EntryItem({ vid, entry: e, kml }: { vid: string; entry: Entry; kml?: number }) {
  const Icon = KIND_ICON[e.kind];
  const detail = entryDetail(e, kml);
  return (
    <Link className={`${card} flex items-center gap-3 border-l-4 ${KIND_BORDER[e.kind]}`} to={paths.entry(vid, e.id)}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${KIND_SOFT[e.kind]}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <strong className="truncate">{entryTitle(e)}</strong>
          <strong className="whitespace-nowrap">{brl(e.amount)}</strong>
        </span>
        <span className="text-sm text-muted">{[date(e.date), e.odometer != null ? km(e.odometer) : null].filter(Boolean).join(' · ')}</span>
        {detail && <span className="truncate text-xs text-muted">{detail}</span>}
      </span>
    </Link>
  );
}

function entryTitle(e: Entry) {
  if (e.kind === 'fuel') return e.fuelType || 'Abastecimento';
  return e.description || e.category || ENTRY_KINDS[e.kind].label;
}

function entryDetail(e: Entry, kml?: number) {
  if (e.kind === 'fuel') {
    const parts = [e.liters ? `${num(e.liters, 2)} L` : null, kml ? `${num(kml, 1)} km/l` : null, e.fullTank ? null : 'parcial'];
    return parts.filter(Boolean).join(' · ');
  }
  return e.description && e.category ? e.category : null;
}
