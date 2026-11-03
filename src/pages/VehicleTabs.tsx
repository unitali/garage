import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EntryItem from '../components/EntryItem';
import ReminderCarousel from '../components/ReminderCarousel';
import BillCard from '../components/BillCard';
import { markReminderDone } from '../db';
import { ENTRY_KINDS } from '../constants';
import { costSummary, fuelStats, isOpenBill, sortEntriesByKm, type DueBill, type DueReminder } from '../lib/calc';
import { today } from '../lib/dates';
import { brl, date, dueText, km, num } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry, EntryKind, Vehicle } from '../types';
import {
  KIND_ICON,
  KIND_TEXT,
  LEVEL_BORDER,
  LEVEL_DOT,
  LEVEL_TEXT,
  btn,
  card,
  cardRow,
  chip,
  chips,
  emptyText,
  grow,
  list,
  sectionTitle,
} from '../ui';

// Conteúdo das abas da tela inicial (veículo selecionado): Histórico, Resumo, Despesas e Lembretes.

const KINDS = Object.keys(ENTRY_KINDS) as EntryKind[];
const kvRow = 'flex justify-between gap-3 border-b border-line py-1.5 last:border-b-0';

/* ---------------- Histórico ---------------- */

export function History({ uid, v, entries, due, bills }: { uid: string; v: Vehicle; entries: Entry[]; due: DueReminder[]; bills: DueBill[] }) {
  const [filter, setFilter] = useState<EntryKind | 'all'>('all');
  const consumption = useMemo(() => fuelStats(entries).byEntry, [entries]);
  const sorted = useMemo(
    // contas em aberto ficam nos lembretes; entram no histórico depois de pagas
    () => sortEntriesByKm(entries.filter((e) => !isOpenBill(e)), v.initialOdometer).filter((e) => filter === 'all' || e.kind === filter),
    [entries, v.initialOdometer, filter],
  );

  // só os que estão perto de vencer (janela de Configurações → Lembretes) ou vencidos
  const near = due.filter((x) => x.s.near);

  return (
    <div className="flex flex-col gap-4">
      {(near.length > 0 || bills.length > 0) && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className={sectionTitle}>Lembretes próximos</h2>
            <Link className="text-sm font-semibold text-brand" to={paths.home('lembretes')}>
              Ver todos
            </Link>
          </div>
          <ReminderCarousel uid={uid} vid={v.id} items={near} bills={bills} />
        </section>
      )}

      <div className={chips}>
        <button className={chip(filter === 'all')} onClick={() => setFilter('all')}>
          Todos
        </button>
        {KINDS.map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <button key={k} className={chip(filter === k)} onClick={() => setFilter(k)}>
              <Icon className={`size-4 ${filter === k ? '' : KIND_TEXT[k]}`} />
              {ENTRY_KINDS[k].plural}
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <p className={emptyText}>
          {entries.length === 0 ? 'Nada registrado ainda. Use Abastecer ou Serviço na barra de baixo.' : 'Nenhum registro deste tipo.'}
        </p>
      ) : (
        <ul className={list}>
          {sorted.map((e) => (
            <li key={e.id}>
              <EntryItem vid={v.id} entry={e} kml={consumption[e.id]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Resumo ---------------- */

export function Summary({ v, entries, due, current }: { v: Vehicle; entries: Entry[]; due: DueReminder[]; current: number }) {
  const cost = useMemo(() => costSummary(entries, v, current), [entries, v, current]);
  const fuel = useMemo(() => fuelStats(entries), [entries]);
  const alerts = due.filter((x) => x.s.near);
  const unit = v.type === 'bike' ? 'km/kWh' : 'km/l';

  return (
    <div className="flex flex-col gap-4">
      {alerts.length > 0 && (
        <section className={card}>
          <h2 className={sectionTitle}>Atenção</h2>
          <ul>
            {alerts.map(({ r, s }) => (
              <li key={r.id}>
                <Link to={paths.reminder(v.id, r.id)} className="flex items-center gap-2.5 py-1.5">
                  <span className={`size-2.5 shrink-0 rounded-full ${LEVEL_DOT[s.level]}`} />
                  <span className={grow}>{r.title}</span>
                  <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{dueText(s)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Este mês" value={brl(cost.month)} />
        <Stat label={`Em ${today().slice(0, 4)}`} value={brl(cost.year)} />
        <Stat label="Consumo médio" value={fuel.avg ? `${num(fuel.avg, 1)} ${unit}` : '—'} hint={fuel.avg ? undefined : 'precisa de 2 tanques cheios'} />
        <Stat label="Último consumo" value={fuel.last ? `${num(fuel.last, 1)} ${unit}` : '—'} />
        <Stat label="Custo por km" value={cost.costPerKm ? brl(cost.costPerKm) : '—'} hint="tudo incluído" />
        <Stat label="Combustível por km" value={cost.fuelCostPerKm ? brl(cost.fuelCostPerKm) : '—'} />
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Gastos totais</h2>
        <dl>
          {KINDS.map((k) => {
            const Icon = KIND_ICON[k];
            return (
              <div key={k} className={kvRow}>
                <dt className="flex items-center gap-2">
                  <Icon className={`size-4 ${KIND_TEXT[k]}`} />
                  {ENTRY_KINDS[k].plural}
                </dt>
                <dd className="font-semibold whitespace-nowrap">{brl(cost.byKind[k])}</dd>
              </div>
            );
          })}
          <div className={`${kvRow} font-bold`}>
            <dt>Total</dt>
            <dd className="whitespace-nowrap">{brl(cost.total)}</dd>
          </div>
          <div className={kvRow}>
            <dt>Km rodados desde o cadastro</dt>
            <dd className="font-semibold whitespace-nowrap">{km(cost.kmDriven)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-3 shadow-xs dark:shadow-none">
      <span className="text-sm text-muted">{label}</span>
      <strong className="text-lg">{value}</strong>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/* ---------------- Despesas ---------------- */

export function Expenses({ v, entries }: { v: Vehicle; entries: Entry[] }) {
  const expenses = useMemo(
    () => sortEntriesByKm(entries.filter((e) => e.kind === 'expense'), v.initialOdometer),
    [entries, v.initialOdometer],
  );
  const year = today().slice(0, 4);
  const totals = useMemo(() => {
    let all = 0;
    let inYear = 0;
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      all += e.amount;
      if (e.date.startsWith(year)) inYear += e.amount;
      const c = e.category || 'Outro';
      byCategory.set(c, (byCategory.get(c) ?? 0) + e.amount);
    }
    return { all, inYear, byCategory: [...byCategory].sort((a, b) => b[1] - a[1]) };
  }, [expenses, year]);

  if (expenses.length === 0)
    return (
      <div className="px-4 py-8 text-center">
        <p className="my-1">Nenhuma despesa.</p>
        <p className="my-1 text-muted">Toque no + para registrar IPVA, seguro, licenciamento, multa…</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-2">
        <Stat label={`Em ${year}`} value={brl(totals.inYear)} />
        <Stat label="Total" value={brl(totals.all)} />
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>Por categoria</h2>
        <dl>
          {totals.byCategory.map(([c, value]) => (
            <div key={c} className={kvRow}>
              <dt>{c}</dt>
              <dd className="font-semibold whitespace-nowrap">{brl(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ul className={list}>
        {expenses.map((e) => (
          <li key={e.id}>
            <EntryItem vid={v.id} entry={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Lembretes ---------------- */

export function Reminders({
  uid,
  v,
  due,
  bills,
  current,
}: {
  uid: string;
  v: Vehicle;
  due: DueReminder[];
  bills: DueBill[];
  current: number;
}) {
  const billList = bills.length > 0 && (
    <section className="mb-4">
      <h2 className={sectionTitle}>Contas do mês</h2>
      <ul className={list}>
        {bills.map((b) => (
          <li key={b.e.id}>
            <BillCard uid={uid} vid={v.id} bill={b} />
          </li>
        ))}
      </ul>
    </section>
  );

  if (due.length === 0)
    return (
      <>
        {billList}
        <div className="px-4 py-8 text-center">
          <p className="my-1">Nenhum lembrete.</p>
          <p className="my-1 text-muted">Toque no + para criar lembretes por km e/ou por tempo — troca de óleo, IPVA, revisão…</p>
        </div>
      </>
    );

  return (
    <>
      {billList}
      <ul className={list}>
        {due.map(({ r, s, due: when, estimated }) => (
          <li key={r.id} className={`${cardRow} border-l-4 ${LEVEL_BORDER[s.level]}`}>
            <Link to={paths.reminder(v.id, r.id)} className={grow}>
              <strong>{r.title}</strong>
              <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{dueText(s)}</span>
              <span className={`text-xs ${s.level === 'overdue' ? 'font-semibold text-danger' : 'text-muted'}`}>
                Próximo:{' '}
                {[s.nextKm != null ? km(s.nextKm) : null, when ? `${estimated ? '≈ ' : ''}${date(when)}` : null].filter(Boolean).join(' · ')}
              </span>
            </Link>
            <button
              className={btn('default', 'sm')}
              onClick={() => {
                if (confirm(`Marcar "${r.title}" como feito hoje com ${km(current)}?`)) markReminderDone(uid, v.id, r.id, current, today());
              }}
            >
              Feito
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
