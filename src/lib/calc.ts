import type { Entry, Reminder, ServiceItem, Vehicle } from '../types';
import { addDays, addMonths, diffDays, endOfMonth, fromTimestamp, startOfMonth, today } from './dates.ts';

/** km atual = maior km entre o cadastro e os registros */
export function currentOdometer(v: Pick<Vehicle, 'initialOdometer'> | null, entries: Entry[]): number {
  let max = v?.initialOdometer ?? 0;
  for (const e of entries) if (e.odometer != null && e.odometer > max) max = e.odometer;
  return max;
}

export interface FuelStats {
  /** média km/l de todos os trechos tanque cheio → tanque cheio */
  avg: number | null;
  /** km/l do trecho mais recente */
  last: number | null;
  /** km/l por abastecimento (só os que fecham um trecho) */
  byEntry: Record<string, number>;
  totalLiters: number;
}

/**
 * Método do tanque cheio: o consumo só é calculado entre dois abastecimentos
 * de tanque cheio. Abastecimentos parciais no meio somam os litros no trecho.
 */
export function fuelStats(entries: Entry[]): FuelStats {
  const fills = entries
    .filter((e) => e.kind === 'fuel' && e.odometer != null && (e.liters ?? 0) > 0)
    .sort((a, b) => a.odometer! - b.odometer! || a.date.localeCompare(b.date));

  let totalKm = 0;
  let totalL = 0;
  let last: number | null = null;
  let prevFullKm: number | null = null;
  let litersSince = 0;
  let totalLiters = 0;
  const byEntry: Record<string, number> = {};

  for (const f of fills) {
    totalLiters += f.liters!;
    if (prevFullKm === null) {
      if (f.fullTank) prevFullKm = f.odometer!;
      continue;
    }
    litersSince += f.liters!;
    if (f.fullTank) {
      const dist = f.odometer! - prevFullKm;
      if (dist > 0 && litersSince > 0) {
        const kml = dist / litersSince;
        totalKm += dist;
        totalL += litersSince;
        byEntry[f.id] = kml;
        last = kml;
      }
      prevFullKm = f.odometer!;
      litersSince = 0;
    }
  }
  return { avg: totalL > 0 ? totalKm / totalL : null, last, byEntry, totalLiters };
}

export interface CostSummary {
  total: number;
  year: number;
  month: number;
  byKind: Record<Entry['kind'], number>;
  kmDriven: number;
  costPerKm: number | null;
  fuelCostPerKm: number | null;
}

export function costSummary(entries: Entry[], v: Pick<Vehicle, 'initialOdometer'> | null, current: number, ref = today()): CostSummary {
  const y = ref.slice(0, 4);
  const ym = ref.slice(0, 7);
  const byKind = { fuel: 0, service: 0, expense: 0 };
  let total = 0;
  let year = 0;
  let month = 0;
  for (const e of entries) {
    total += e.amount;
    byKind[e.kind] += e.amount;
    if (e.date.startsWith(y)) year += e.amount;
    if (e.date.startsWith(ym)) month += e.amount;
  }
  const kmDriven = Math.max(0, current - (v?.initialOdometer ?? current));
  return {
    total,
    year,
    month,
    byKind,
    kmDriven,
    costPerKm: kmDriven > 0 ? total / kmDriven : null,
    fuelCostPerKm: kmDriven > 0 && byKind.fuel > 0 ? byKind.fuel / kmDriven : null,
  };
}

export type ReminderLevel = 'overdue' | 'soon' | 'ok';

export interface ReminderStatus {
  nextKm: number | null;
  nextDate: string | null;
  kmLeft: number | null;
  daysLeft: number | null;
  /** cor: vencido (vermelho), urgente (laranja) ou em dia (verde) */
  level: ReminderLevel;
  /** dentro da antecedência de aviso (ou urgente/vencido): aparece no topo do histórico */
  near: boolean;
}

/**
 * Janelas dos lembretes (Configurações → Lembretes):
 * - aviso: faltando até `km` ou `months` meses → aparece no topo do histórico
 * - urgente: faltando até `urgentKm` ou `urgentDays` dias → laranja
 */
export interface AlertWindow {
  km: number;
  months: number;
  urgentKm: number;
  urgentDays: number;
}

export const DEFAULT_ALERT: AlertWindow = { km: 1000, months: 1, urgentKm: 200, urgentDays: 7 };

/** Vencido: passou do km ou da data. Urgente: dentro da janela urgente. Em dia: o resto. */
export function reminderStatus(r: Reminder, current: number, ref = today(), alert = DEFAULT_ALERT): ReminderStatus {
  const nextKm = r.intervalKm && r.lastKm != null ? r.lastKm + r.intervalKm : null;
  const nextDate = r.intervalMonths && r.lastDate ? addMonths(r.lastDate, r.intervalMonths) : null;
  const kmLeft = nextKm != null ? nextKm - current : null;
  const daysLeft = nextDate ? diffDays(ref, nextDate) : null;

  let level: ReminderLevel = 'ok';
  if ((kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft <= 0)) level = 'overdue';
  else if ((kmLeft != null && kmLeft <= alert.urgentKm) || (daysLeft != null && daysLeft <= alert.urgentDays)) level = 'soon';

  const near =
    level !== 'ok' ||
    (kmLeft != null && kmLeft <= alert.km) ||
    (nextDate != null && nextDate <= addMonths(ref, alert.months));

  return { nextKm, nextDate, kmLeft, daysLeft, level, near };
}

const LEVEL_ORDER: Record<ReminderLevel, number> = { overdue: 0, soon: 1, ok: 2 };

/**
 * Média de km rodados por dia, do registro mais antigo ao mais recente (o cadastro conta como um ponto).
 * null com menos de uma semana de histórico — a estimativa seria chute.
 */
export function kmPerDay(v: Pick<Vehicle, 'initialOdometer' | 'createdAt'> | null, entries: Entry[]): number | null {
  const points = entries.filter((e) => e.odometer != null).map((e) => ({ date: e.date, km: e.odometer! }));
  if (v) points.push({ date: fromTimestamp(v.createdAt), km: v.initialOdometer });
  if (points.length < 2) return null;
  points.sort((a, b) => a.date.localeCompare(b.date) || a.km - b.km);
  const first = points[0];
  const last = points[points.length - 1];
  const days = diffDays(first.date, last.date);
  const dist = Math.max(...points.map((p) => p.km)) - first.km;
  return days >= 7 && dist > 0 ? dist / days : null;
}

export interface DueReminder {
  r: Reminder;
  s: ReminderStatus;
  /** quando vence: a data do intervalo em meses ou a estimada pelo km — a que vier primeiro */
  due: string | null;
  /** true quando `due` veio da média de km/dia */
  estimated: boolean;
}

export function reminderDue(s: ReminderStatus, rate: number | null, ref = today()): Pick<DueReminder, 'due' | 'estimated'> {
  const byKm = s.kmLeft != null && rate ? addDays(ref, Math.max(0, Math.ceil(s.kmLeft / rate))) : null;
  if (byKm && (!s.nextDate || byKm < s.nextDate)) return { due: byKm, estimated: true };
  return { due: s.nextDate, estimated: false };
}

/** Do que vence antes para o que vence depois; sem data (só km e sem histórico) vão por último, por urgência. */
export function remindersByDue(
  list: Reminder[],
  current: number,
  rate: number | null,
  ref = today(),
  alert = DEFAULT_ALERT,
): DueReminder[] {
  return list
    .map((r) => {
      const s = reminderStatus(r, current, ref, alert);
      return { r, s, ...reminderDue(s, rate, ref) };
    })
    .sort(
      (a, b) =>
        (a.due && b.due ? a.due.localeCompare(b.due) : a.due ? -1 : b.due ? 1 : 0) ||
        LEVEL_ORDER[a.s.level] - LEVEL_ORDER[b.s.level] ||
        a.r.title.localeCompare(b.r.title),
    );
}

/**
 * Ordem do histórico: km do maior para o menor. Registro sem km (ex: IPVA) entra pelo km que o
 * veículo tinha naquela data. Empate: data desc, criação desc.
 */
export function sortEntriesByKm(list: Entry[], initialOdometer = 0): Entry[] {
  const withKm = list.filter((e) => e.odometer != null).sort((a, b) => a.date.localeCompare(b.date));
  const kmAt = (date: string) => {
    let max = initialOdometer;
    for (const e of withKm) {
      if (e.date > date) break;
      max = Math.max(max, e.odometer!);
    }
    return max;
  };
  const effective = new Map(list.map((e) => [e.id, e.odometer ?? kmAt(e.date)]));
  return [...list].sort(
    (a, b) => effective.get(b.id)! - effective.get(a.id)! || b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
}

/** Itens de um serviço; serviços antigos (sem lista) viram um item só com a categoria e o valor do registro. */
export function serviceItems(e: Pick<Entry, 'items' | 'category' | 'amount'>): ServiceItem[] {
  return e.items?.length ? e.items : [{ category: e.category, amount: e.amount }];
}

/** Soma em centavos para não acumular erro de ponto flutuante (0,1 + 0,2). */
export function sumItems(items: { amount: number }[]): number {
  return items.reduce((cents, i) => cents + Math.round(i.amount * 100), 0) / 100;
}

export type ScheduleMode = 'installments' | 'recurring';

/**
 * Vencimentos de uma despesa parcelada/recorrente: o 1º na data escolhida e os demais mês a mês.
 * Parcelado divide o total em centavos (a sobra vai para as primeiras); recorrente repete o valor.
 */
export function buildSchedule(mode: ScheduleMode, firstDate: string, amount: number, count: number): { date: string; amount: number }[] {
  const dates = Array.from({ length: count }, (_, i) => addMonths(firstDate, i));
  if (mode === 'recurring') return dates.map((date) => ({ date, amount }));
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / count);
  const rest = cents - base * count;
  return dates.map((date, i) => ({ date, amount: (base + (i < rest ? 1 : 0)) / 100 }));
}

/**
 * Conta em aberto: despesa marcada como não paga. Parcelas antigas (sem o campo `paid`) contam
 * como pagas antes do mês atual e em aberto a partir dele.
 */
export function isOpenBill(e: Entry, ref = today()): boolean {
  if (e.kind !== 'expense' || e.paid === true) return false;
  if (e.paid === false) return true;
  return !!e.series && e.date >= startOfMonth(ref);
}

export interface DueBill {
  e: Entry;
  /** reaproveita o texto/cores dos lembretes: só `daysLeft` preenchido */
  s: ReminderStatus;
}

/** Contas do mês (e vencidas não pagas), por vencimento: aparecem como lembrete até "Pago". */
export function billsDue(entries: Entry[], ref = today(), alert = DEFAULT_ALERT): DueBill[] {
  const last = endOfMonth(ref);
  return entries
    .filter((e) => isOpenBill(e, ref) && e.date <= last)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((e) => {
      const daysLeft = diffDays(ref, e.date);
      const level: ReminderLevel = daysLeft < 0 ? 'overdue' : daysLeft <= alert.urgentDays ? 'soon' : 'ok';
      return { e, s: { nextKm: null, nextDate: e.date, kmLeft: null, daysLeft, level, near: true } };
    });
}
