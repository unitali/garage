import { Link } from 'react-router-dom';
import { ENTRY_KINDS } from '../constants';
import { serviceItems } from '../lib/calc';
import { rotuloParcela } from '../lib/summary';
import { brl, km, num, shortDate } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry } from '../types';
import { entrySoft, iconCircle, KIND_ICON } from '../ui';

/**
 * Linha de um registro (dentro de um card com divisórias): ícone do tipo, título, linha secundária
 * e o valor à direita sem quebrar. `kml` é o consumo do trecho, quando houver.
 */
export default function EntryRow({ vid, entry: e, kml }: { vid: string; entry: Entry; kml?: number }) {
  const Icon = KIND_ICON[e.kind];
  const items = e.kind === 'service' ? serviceItems(e) : [];
  const listItems = items.length > 1 || (e.kind === 'service' && !!e.title);
  const note = (e.notes || e.description)?.split('\n')[0];

  return (
    <Link to={paths.entry(vid, e.id)} className="flex min-h-11 items-start gap-3 py-3">
      <span className={`${iconCircle} ${entrySoft(e)}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start justify-between gap-3">
          <strong className="min-w-0 break-words">{title(e)}</strong>
          <strong className="shrink-0 whitespace-nowrap">{brl(e.amount)}</strong>
        </span>
        <span className="text-sm text-muted">{secondary(e, kml)}</span>
        {listItems && (
          <ul className="mt-1 flex flex-col gap-0.5 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words">{i.category}</span>
                <span className="shrink-0 whitespace-nowrap text-muted">{brl(i.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {note && <span className="break-words text-xs text-muted">{note}</span>}
      </span>
    </Link>
  );
}

function title(e: Entry) {
  if (e.kind === 'fuel') return [e.fuelType || 'Abastecimento', e.liters ? `${num(e.liters, 1)} L` : null].filter(Boolean).join(' · ');
  if (e.kind === 'service') {
    if (e.title) return e.title;
    if (e.items && e.items.length > 1) return ENTRY_KINDS.service.label;
  }
  const base = e.category || ENTRY_KINDS[e.kind].label;
  return [base, rotuloParcela(e)].filter(Boolean).join(' · ');
}

function secondary(e: Entry, kml?: number) {
  const parts = [shortDate(e.date), e.odometer != null ? km(e.odometer) : null];
  if (e.kind === 'fuel') parts.push(kml ? `${num(kml, 1)} km/l` : e.fullTank ? null : 'parcial');
  else if (e.kind === 'service') parts.push(ENTRY_KINDS.service.label);
  else if (e.series || e.paid != null) parts.push(e.paid === false ? 'em aberto' : 'pago');
  return parts.filter(Boolean).join(' · ');
}
