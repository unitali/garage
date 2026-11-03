import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import EntryRow from '../components/EntryRow';
import { ENTRY_KINDS } from '../constants';
import { useGarage } from '../garage';
import { fuelStats, sortEntriesByKm } from '../lib/calc';
import { today } from '../lib/dates';
import { brl } from '../lib/format';
import { isPaid } from '../lib/summary';
import { FILTER_KIND, type HistoryFilter } from '../routes/paths';
import type { Entry } from '../types';
import { card, emptyText, main, sectionTitle, splash } from '../ui';

const FILTERS: { id: HistoryFilter | null; label: string }[] = [
  { id: null, label: 'Tudo' },
  { id: 'abastecimento', label: 'Combustível' }, // "Abastecimentos" não cabe com os outros numa linha de 360px
  { id: 'servico', label: ENTRY_KINDS.service.plural },
  { id: 'despesa', label: ENTRY_KINDS.expense.plural },
];

/** filtro compacto: os quatro numa linha só, dividindo a largura */
const filterChip = (active: boolean) =>
  `inline-flex h-9 flex-auto items-center justify-center whitespace-nowrap rounded-full border px-1.5 text-xs font-semibold min-[360px]:px-2.5 ${
    active ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface text-ink'
  }`;

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthTitle = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const sum = (list: Entry[]) => list.reduce((c, e) => c + Math.round(e.amount * 100), 0) / 100;

/** Histórico: só o que já aconteceu (abastecido, feito, pago), por mês. O que está por vir fica em Lembretes. */
export default function History() {
  const { vehicle, entries, current, loading } = useGarage();
  const [params, setParams] = useSearchParams();
  const tipo = params.get('tipo') as HistoryFilter | null;
  const kind = tipo && FILTER_KIND[tipo] ? FILTER_KIND[tipo] : null;
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

  if (loading) return <div className={splash}>Carregando…</div>;

  return (
    <>
      <Header title="Histórico" odometer={current} />
      <main className={`${main} flex flex-col gap-4`}>
        <div className="flex gap-1 min-[360px]:gap-1.5" role="group" aria-label="Filtrar por tipo">
          {FILTERS.map((f) => {
            const active = (tipo ?? null) === f.id;
            return (
              <button
                key={f.label}
                aria-pressed={active}
                className={filterChip(active)}
                onClick={() => setParams(f.id ? { tipo: f.id } : {}, { replace: true })}
              >
                {f.label}
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
                    <div key={c} className="flex justify-between gap-3 border-b border-line py-2 last:border-b-0">
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
                  <h2 className="mb-2 flex justify-between gap-3 px-1 text-xs font-bold tracking-wider text-muted uppercase">
                    <span>{monthTitle(ym)}</span>
                    <span className="whitespace-nowrap">{brl(sum(list))}</span>
                  </h2>
                  <ul className={`${card} divide-y divide-line py-0`}>
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
