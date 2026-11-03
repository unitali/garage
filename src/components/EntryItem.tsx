import { Link } from 'react-router-dom';
import { ENTRY_KINDS } from '../constants';
import { isOpenBill, serviceItems } from '../lib/calc';
import { today } from '../lib/dates';
import { brl, date, km, num } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry } from '../types';
import { KIND_BORDER, KIND_ICON, KIND_SOFT, card } from '../ui';

/** Card de um abastecimento, serviço ou despesa, na cor do tipo; `kml` é o consumo do trecho, quando houver. */
export default function EntryItem({ vid, entry: e, kml }: { vid: string; entry: Entry; kml?: number }) {
  const Icon = KIND_ICON[e.kind];
  const detail = entryDetail(e, kml);
  const items = listedItems(e);
  const paidBill = isPaidBill(e);
  return (
    <Link
      className={`${card} flex items-start gap-3 border-l-4 ${paidBill ? 'border-l-ok' : KIND_BORDER[e.kind]}`}
      to={paths.entry(vid, e.id)}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${KIND_SOFT[e.kind]}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <strong className="truncate">{entryTitle(e)}</strong>
          <strong className="whitespace-nowrap">{brl(e.amount)}</strong>
        </span>
        <span className="text-sm text-muted">
          {[date(e.date), e.odometer != null ? km(e.odometer) : null, seriesLabel(e)].filter(Boolean).join(' · ')}
          {paidBill ? (
            <span className="font-semibold text-ok"> · pago</span>
          ) : (
            e.date > today() && <span className="font-semibold text-warn"> · a vencer</span>
          )}
        </span>
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

/** Última linha: litros e consumo, ou as observações do serviço/despesa (descrição em registros antigos). */
function entryDetail(e: Entry, kml?: number) {
  if (e.kind === 'fuel') {
    const parts = [e.liters ? `${num(e.liters, 2)} L` : null, kml ? `${num(kml, 1)} km/l` : null, e.fullTank ? null : 'parcial'];
    return parts.filter(Boolean).join(' · ');
  }
  return (e.notes || e.description)?.split('\n')[0] || null;
}

/** "Parcela 2/10" ou "Recorrente 3/12". */
function seriesLabel(e: Entry) {
  if (!e.series) return null;
  return `${e.series.type === 'installments' ? 'Parcela' : 'Recorrente'} ${e.series.index}/${e.series.count}`;
}

/** Despesa paga: marcada como paga, ou parcela antiga (sem o campo) de mês já passado. Borda verde. */
function isPaidBill(e: Entry) {
  return e.kind === 'expense' && (e.paid === true || (e.paid == null && !!e.series && !isOpenBill(e)));
}
