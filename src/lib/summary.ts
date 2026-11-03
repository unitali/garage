// Cálculos de exibição da tela inicial e do histórico (funções puras, testadas em tests/summary.test.ts).

import { DEFAULT_ALERT, isPaid, remindersByDue, type AlertWindow, type DueReminder } from './calc.ts';
import { addMonths, today } from './dates.ts';
import type { Entry, Reminder } from '../types';

export { isPaid };

const inYear = (e: Entry, ref: string) => e.date.startsWith(ref.slice(0, 4));
const sum = (list: Entry[]) => list.reduce((cents, e) => cents + Math.round(e.amount * 100), 0) / 100;

/** Gasto do ano já realizado (pago / data até hoje). */
export const gastoPagoNoAno = (entries: Entry[], ref = today()) => sum(entries.filter((e) => inYear(e, ref) && isPaid(e, ref)));

/** Previsto no ano: o que ainda não foi pago (parcelas futuras, contas em aberto). */
export const gastoPrevistoNoAno = (entries: Entry[], ref = today()) => sum(entries.filter((e) => inYear(e, ref) && !isPaid(e, ref)));

export interface ResumoSerie {
  /** parcelas da série, por número */
  parcelas: Entry[];
  total: number;
  pagas: number;
  valorPago: number;
  restante: number;
  /** próxima a pagar (a mais antiga em aberto), ou null se quitada */
  proxima: Entry | null;
}

export function resumoDaSerie(parcelas: Entry[], ref = today()): ResumoSerie {
  const sorted = [...parcelas].sort((a, b) => (a.series?.index ?? 0) - (b.series?.index ?? 0) || a.date.localeCompare(b.date));
  const pagas = sorted.filter((e) => isPaid(e, ref));
  const abertas = sorted.filter((e) => !isPaid(e, ref)).sort((a, b) => a.date.localeCompare(b.date));
  return {
    parcelas: sorted,
    total: sorted[0]?.series?.count ?? sorted.length,
    pagas: pagas.length,
    valorPago: sum(pagas),
    restante: sum(abertas),
    proxima: abertas[0] ?? null,
  };
}

/** Despesas parceladas/recorrentes agrupadas por série (as mais recentes primeiro). */
export function seriesDe(entries: Entry[]): Entry[][] {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!e.series) continue;
    const list = groups.get(e.series.id) ?? [];
    list.push(e);
    groups.set(e.series.id, list);
  }
  return [...groups.values()].sort((a, b) => Math.max(...b.map((e) => e.createdAt)) - Math.max(...a.map((e) => e.createdAt)));
}

/**
 * Lembrete mais urgente: vencido > em breve > o resto. Entre vencidos, por data antes de só por km
 * (prazo legal costuma pesar mais); depois o que venceu há mais tempo / vence antes.
 */
export function proximaAcao(
  reminders: Reminder[],
  kmAtual: number,
  ref = today(),
  rate: number | null = null,
  alert: AlertWindow = DEFAULT_ALERT,
): DueReminder | null {
  const rank = (x: DueReminder) => (x.s.level === 'overdue' ? 0 : x.s.level === 'soon' ? 1 : 2);
  const byDate = (x: DueReminder) => (x.s.daysLeft != null && x.s.daysLeft <= 0 ? 0 : 1);
  const sorted = remindersByDue(reminders, kmAtual, rate, ref, alert).sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (rank(a) === 0 ? byDate(a) - byDate(b) : 0) ||
      (a.due && b.due ? a.due.localeCompare(b.due) : a.due ? -1 : b.due ? 1 : 0) ||
      (a.s.kmLeft ?? Infinity) - (b.s.kmLeft ?? Infinity),
  );
  return sorted[0] ?? null;
}

export type AVencerItem = { type: 'bill'; entry: Entry; date: string } | { type: 'reminder'; due: DueReminder; date: string | null };

/** "A vencer": contas em aberto e lembretes, pela data mais próxima (sem data por último). */
export function aVencer(entries: Entry[], due: DueReminder[], ref = today(), limit = 3, exceptReminderId?: string): AVencerItem[] {
  const bills: AVencerItem[] = entries
    .filter((e) => e.kind === 'expense' && !isPaid(e, ref))
    .map((entry) => ({ type: 'bill', entry, date: entry.date }));
  const reminders: AVencerItem[] = due.filter((d) => d.r.id !== exceptReminderId).map((d) => ({ type: 'reminder', due: d, date: d.due }));
  return [...bills, ...reminders]
    .sort((a, b) => (a.date && b.date ? a.date.localeCompare(b.date) : a.date ? -1 : b.date ? 1 : 0))
    .slice(0, limit);
}

/** km/l por mês de fechamento do trecho (método do tanque cheio), para comparar meses. */
export function consumoPorMes(entries: Entry[]): Map<string, number> {
  const fills = entries
    .filter((e) => e.kind === 'fuel' && e.odometer != null && (e.liters ?? 0) > 0)
    .sort((a, b) => a.odometer! - b.odometer! || a.date.localeCompare(b.date));
  const acc = new Map<string, { km: number; l: number }>();
  let prevFullKm: number | null = null;
  let litersSince = 0;
  for (const f of fills) {
    if (prevFullKm === null) {
      if (f.fullTank) prevFullKm = f.odometer!;
      continue;
    }
    litersSince += f.liters!;
    if (!f.fullTank) continue;
    const dist = f.odometer! - prevFullKm;
    if (dist > 0) {
      const ym = f.date.slice(0, 7);
      const m = acc.get(ym) ?? { km: 0, l: 0 };
      acc.set(ym, { km: m.km + dist, l: m.l + litersSince });
    }
    prevFullKm = f.odometer!;
    litersSince = 0;
  }
  return new Map([...acc].map(([ym, m]) => [ym, m.km / m.l]));
}

/** Variação do consumo do mês em relação ao anterior (0,03 = +3%), ou null sem os dois meses. */
export function variacaoConsumo(entries: Entry[], ref = today()): number | null {
  const byMonth = consumoPorMes(entries);
  const atual = byMonth.get(ref.slice(0, 7));
  const anterior = byMonth.get(addMonths(ref, -1).slice(0, 7));
  return atual && anterior ? atual / anterior - 1 : null;
}
