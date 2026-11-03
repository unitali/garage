// Cálculos de exibição da tela inicial e do histórico (funções puras, testadas em tests/summary.test.ts).

import { DEFAULT_ALERT, isPaid, remindersByDue, type AlertWindow, type DueBill, type DueReminder, type ReminderStatus } from './calc.ts';
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

/**
 * Rótulo da parcela, igual em todo lugar (Histórico, Lembretes, Início): "parcela 3 de 24".
 * É a posição dela na série — quantas já foram pagas vem de `resumoDaSerie`.
 */
export function rotuloParcela(e: Pick<Entry, 'series'>): string {
  return e.series ? `parcela ${e.series.index} de ${e.series.count}` : '';
}

/** "Seguro · parcela 3 de 24" (ou só a categoria, fora de série) */
export const tituloConta = (e: Pick<Entry, 'series' | 'category'>) => [e.category, rotuloParcela(e)].filter(Boolean).join(' · ');

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

type Urgencia = { s: ReminderStatus; date: string | null };

/**
 * Do mais urgente para o menos: vencido > próximo > em dia. Entre vencidos, por data antes de só por km
 * (prazo legal costuma pesar mais); depois o que venceu há mais tempo / vence antes.
 */
function urgencia(a: Urgencia, b: Urgencia): number {
  const rank = (x: Urgencia) => (x.s.level === 'overdue' ? 0 : x.s.level === 'soon' ? 1 : 2);
  const byDate = (x: Urgencia) => (x.s.daysLeft != null && x.s.daysLeft <= 0 ? 0 : 1);
  return (
    rank(a) - rank(b) ||
    (rank(a) === 0 ? byDate(a) - byDate(b) : 0) ||
    (a.date && b.date ? a.date.localeCompare(b.date) : a.date ? -1 : b.date ? 1 : 0) ||
    (a.s.kmLeft ?? Infinity) - (b.s.kmLeft ?? Infinity)
  );
}

/** Lembrete mais urgente (mesmo fora da janela de aviso). */
export function proximaAcao(
  reminders: Reminder[],
  kmAtual: number,
  ref = today(),
  rate: number | null = null,
  alert: AlertWindow = DEFAULT_ALERT,
): DueReminder | null {
  const sorted = remindersByDue(reminders, kmAtual, rate, ref, alert).sort((a, b) =>
    urgencia({ s: a.s, date: a.due }, { s: b.s, date: b.due }),
  );
  return sorted[0] ?? null;
}

export type CardItem = { type: 'reminder'; due: DueReminder } | { type: 'bill'; bill: DueBill };

/**
 * Cards da tela inicial: lembretes e contas em aberto dentro da antecedência de aviso
 * (Configurações → Lembretes), do mais urgente. `bills` já vem filtrado pela janela (billsDue).
 */
export function cardsDoInicio(due: DueReminder[], bills: DueBill[]): CardItem[] {
  const key = (c: CardItem): Urgencia => (c.type === 'bill' ? { s: c.bill.s, date: c.bill.e.date } : { s: c.due.s, date: c.due.due });
  const items: CardItem[] = [
    ...due.filter((d) => d.s.near).map((d) => ({ type: 'reminder' as const, due: d })),
    ...bills.map((b) => ({ type: 'bill' as const, bill: b })),
  ];
  return items.sort((a, b) => urgencia(key(a), key(b)));
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
