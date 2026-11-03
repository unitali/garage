import { Link } from 'react-router-dom';
import { ENTRY_KINDS } from '../constants';
import { serviceItems } from '../lib/calc';
import { brl, date, km, num } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry } from '../types';
import { KIND_BORDER, KIND_ICON, KIND_SOFT, card } from '../ui';

/** Card de um abastecimento, serviço ou despesa, na cor do tipo; `kml` é o consumo do trecho, quando houver. */
export default function EntryItem({ vid, entry: e, kml }: { vid: string; entry: Entry; kml?: number }) {
  const Icon = KIND_ICON[e.kind];
  const detail = entryDetail(e, kml);
  const items = listedItems(e);
  return (
    <Link className={`${card} flex items-start gap-3 border-l-4 ${KIND_BORDER[e.kind]}`} to={paths.entry(vid, e.id)}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${KIND_SOFT[e.kind]}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <strong className="truncate">{entryTitle(e)}</strong>
          <strong className="whitespace-nowrap">{brl(e.amount)}</strong>
        </span>
        <span className="text-sm text-muted">{[date(e.date), e.odometer != null ? km(e.odometer) : null].filter(Boolean).join(' · ')}</span>
        {items && (
          <ul className="mt-1 flex flex-col gap-0.5 border-l-2 border-line pl-2.5 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-baseline justify-between gap-2">
                <span className="truncate">{i.category}</span>
                <span className="whitespace-nowrap text-muted">{brl(i.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {detail && <span className="truncate text-xs text-muted">{detail}</span>}
      </span>
    </Link>
  );
}

/** Título: combustível; serviço: o título dado, a categoria (um item) ou "Serviço"; despesa: a categoria. */
function entryTitle(e: Entry) {
  if (e.kind === 'fuel') return e.fuelType || 'Abastecimento';
  if (e.kind === 'service') {
    if (e.title) return e.title;
    if (e.items && e.items.length > 1) return ENTRY_KINDS.service.label;
  }
  return e.category || ENTRY_KINDS[e.kind].label;
}

/** Itens listados no card: serviço com vários itens, ou com título (aí o item não está no título). */
function listedItems(e: Entry) {
  if (e.kind !== 'service') return null;
  const items = serviceItems(e);
  return items.length > 1 || e.title ? items : null;
}

/** Última linha: litros e consumo, ou a descrição do serviço/despesa. */
function entryDetail(e: Entry, kml?: number) {
  if (e.kind === 'fuel') {
    const parts = [e.liters ? `${num(e.liters, 2)} L` : null, kml ? `${num(kml, 1)} km/l` : null, e.fullTank ? null : 'parcial'];
    return parts.filter(Boolean).join(' · ');
  }
  return e.description || null;
}
