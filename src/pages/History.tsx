import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutList } from 'lucide-react';
import Header from '../components/Header';
import EntryRow from '../components/EntryRow';
import { ENTRY_KINDS } from '../constants';
import { useGarage } from '../hooks/useGarage';
import { fuelStats, sortEntriesByKm } from '../lib/calc';
import { today } from '../lib/dates';
import { isKeyOf } from '../lib/keys';
import { brl } from '../lib/format';
import { isPaid } from '../lib/summary';
import { FILTER_KIND, type HistoryFilter } from '../routes/paths';
import type { Entry } from '../types';
import { card, emptyText, KIND_ICON, KIND_SOFT, main, sectionTitle, splash } from '../ui';

const FILTERS: { id: HistoryFilter | null; label: string }[] = [
  { id: null, label: 'Tudo' },
  { id: 'abastecimento', label: ENTRY_KINDS.fuel.plural },
  { id: 'servico', label: ENTRY_KINDS.service.plural },
  { id: 'despesa', label: ENTRY_KINDS.expense.plural },
];

/** filtro: ícone em cima (nas cores do tipo, como nos registros) e o nome embaixo; rola de lado quando não cabem */
const filterTile = (active: boolean) =>
  `flex min-w-18 flex-auto shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border-2 px-2.5 py-2 ${
    active ? 'border-brand bg-white dark:bg-slate-900 text-brand' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
  }`;

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthTitle = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const sum = (list: Entry[]) => list.reduce((c, e) => c + Math.round(e.amount * 100), 0) / 100;

/** Histórico: só o que já aconteceu (abastecido, feito, pago), por mês. O que está por vir fica em Lembretes. */
export default function History() {
  const { vehicle, entries, current, loading } = useGarage();
  const [params, setParams] = useSearchParams();
  const raw = params.get('tipo');
  const tipo: HistoryFilter | null = raw && isKeyOf(FILTER_KIND, raw) ? raw : null;
  const kind = tipo ? FILTER_KIND[tipo] : null;
  const ref = today();

  const consumption = useMemo(() => fuelStats(entries).byEntry, [entries]);
  // só o que já foi realizado/pago (data até hoje ou marcado "Pago"); o resto fica em Lembretes
  const done = useMemo(() => entries.filter((e) => isPaid(e, ref) && (!kind || e.kind === kind)), [entries, kind, ref]);
  const months = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of done) map.set(e.date.slice(0, 7), [...(map.get(e.date.slice(0, 7)) ?? []), e]);
    return [...map]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([ym, list]) => [ym, sortEntriesByKm(list, vehicle?.initialOdometer)] as const); // dentro do mês, pelo km
  }, [done, vehicle]);
  const byCategory = useMemo(() => {
    if (kind !== 'expense') return [];
    const map = new Map<string, number>();
    for (const e of done) map.set(e.category || 'Outro', (map.get(e.category || 'Outro') ?? 0) + e.amount);
    return [...map].sort((a, b) => b[1] - a[1]);
  }, [done, kind]);

  // filtro vindo pela URL (ex: Despesas) fica visível na rolagem lateral; só mexe nela, nunca na página
  const filtersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = filtersRef.current;
    const btn = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !btn) return;
    const pad = 16;
    if (btn.offsetLeft + btn.offsetWidth > el.scrollLeft + el.clientWidth - pad) el.scrollLeft = btn.offsetLeft + btn.offsetWidth - el.clientWidth + pad;
    else if (btn.offsetLeft < el.scrollLeft + pad) el.scrollLeft = btn.offsetLeft - pad;
  }, [tipo, loading]);

  if (loading) return <div className={splash}>Carregando…</div>;

  return (
    <>
      <Header title="Histórico" odometer={current} />
      <main className={`${main} flex flex-col gap-4`}>
        {/* -mx-4/px-4: os filtros rolam até a borda da tela (o cortado na borda mostra que tem mais) */}
        <div
          ref={filtersRef}
          className="relative -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por tipo"
        >
          {FILTERS.map((f) => {
            const active = (tipo ?? null) === f.id;
            const Icon = f.id ? KIND_ICON[FILTER_KIND[f.id]] : LayoutList;
            return (
              <button
                key={f.label}
                aria-pressed={active}
                className={filterTile(active)}
                onClick={() => setParams(f.id ? { tipo: f.id } : {}, { replace: true })}
              >
                <span className={`grid size-10 place-items-center rounded-full ${f.id ? KIND_SOFT[FILTER_KIND[f.id]] : 'bg-brand-soft text-brand'}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className={`text-[11px] leading-tight whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>

        {!vehicle ? (
          <p className={emptyText}>Cadastre um veículo para começar.</p>
        ) : (
          <>
            {byCategory.length > 1 && (
              <section className={card}>
                <h2 className={sectionTitle}>Por categoria</h2>
                <dl>
                  {byCategory.map(([c, value]) => (
                    <div key={c} className="flex justify-between gap-3 border-b border-slate-200 dark:border-slate-800 py-2 last:border-b-0">
                      <dt className="break-words">{c}</dt>
                      <dd className="shrink-0 font-semibold whitespace-nowrap">{brl(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {months.length === 0 ? (
              <p className={emptyText}>{entries.length === 0 ? 'Nada registrado ainda. Toque em + para começar.' : 'Nenhum registro deste tipo.'}</p>
            ) : (
              months.map(([ym, list]) => (
                <section key={ym}>
                  <h2 className="mb-2 flex justify-between gap-3 px-1 text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                    <span>{monthTitle(ym)}</span>
                    <span className="whitespace-nowrap">{brl(sum(list))}</span>
                  </h2>
                  <ul className={`${card} divide-y divide-slate-200 dark:divide-slate-800 py-0`}>
                    {list.map((e) => (
                      <li key={e.id}>
                        <EntryRow vid={vehicle.id} entry={e} kml={consumption[e.id]} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </>
        )}
      </main>
    </>
  );
}
