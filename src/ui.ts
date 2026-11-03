import { Bell, Bike, Car, CarFront, Fuel, Motorbike, Receipt, Truck, Wrench, type LucideIcon } from 'lucide-react';
import type { ReminderLevel } from './lib/calc';
import type { EntryKind, VehicleType } from './types';

// Classes Tailwind repetidas em várias telas. Cores vêm dos tokens (src/styles/tokens.css).
// Regras: alvos de toque ≥ 44px (min-h-11), cards com raio 16 e padding 14, sem borda colorida à esquerda.

export const splash = 'grid min-h-dvh place-items-center text-muted';
export const main = 'px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))]';
export const emptyText = 'my-4 text-center text-muted';
export const sectionTitle = 'mb-2 text-base font-bold';

export const card = 'rounded-2xl border border-line bg-surface p-3.5 shadow-xs dark:shadow-none';
export const cardRow = `${card} flex items-center gap-3`;
export const list = 'mb-4 flex flex-col gap-3';
export const grow = 'flex min-w-0 flex-1 flex-col gap-0.5';
export const avatarSmall = 'grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg';

const BTN_VARIANTS = {
  default: 'border-line bg-surface',
  primary: 'border-brand bg-brand text-brand-contrast',
  danger: 'border-line bg-transparent text-danger',
};
const BTN_SIZES = { md: 'px-4 py-3', sm: 'px-3 py-2 text-sm' };

export const btn = (variant: keyof typeof BTN_VARIANTS = 'default', size: keyof typeof BTN_SIZES = 'md') =>
  `inline-flex min-h-11 items-center justify-center rounded-xl border font-semibold disabled:opacity-60 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}`;

/** chips quebram linha (nada cortado em telas estreitas) */
export const chips = 'flex flex-wrap gap-2';
export const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
    active ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface text-ink'
  }`;

// ---------- formulários ----------

export const form = 'flex flex-col gap-3.5';
export const grid2 = 'grid grid-cols-2 gap-3';
export const field = 'flex flex-col gap-1.5 text-sm font-semibold';
/** "(opcional)" na mesma linha do rótulo — `contents` evita virar um item do flex em coluna */
export const opt = 'contents font-normal text-muted';
export const hint = 'text-xs font-normal text-muted';
export const input =
  'min-h-11 w-full min-w-0 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-base font-normal text-ink focus:outline-2 focus:-outline-offset-1 focus:outline-brand';
export const checkField = 'flex items-start gap-2.5 text-sm font-semibold';
export const checkbox = 'm-0 size-5 shrink-0 accent-brand';
export const fieldset = 'flex flex-col gap-2 rounded-2xl border border-line px-3 pt-2.5 pb-3';
export const legend = 'px-1 text-sm font-bold';
export const error = 'text-danger';

// ---------- tipo de registro: só no ícone (combustível verde, serviço âmbar, despesa azul, lembrete roxo) ----------

export const KIND_ICON: Record<EntryKind, LucideIcon> = { fuel: Fuel, service: Wrench, expense: Receipt };
/** círculo do ícone: fundo claro + ícone na cor do tipo */
export const KIND_SOFT: Record<EntryKind, string> = {
  fuel: 'bg-fuel-bg text-fuel',
  service: 'bg-service-bg text-service',
  expense: 'bg-expense-bg text-expense',
};
export const KIND_TEXT: Record<EntryKind, string> = { fuel: 'text-fuel', service: 'text-service', expense: 'text-expense' };
export const REMINDER_ICON = Bell;
export const REMINDER_SOFT = 'bg-reminder-bg text-reminder';
export const iconCircle = 'grid size-10 shrink-0 place-items-center rounded-full';

// ---------- status: vermelho só para vencido, âmbar para "em breve", o resto neutro ----------

export const LEVEL_TEXT: Record<ReminderLevel, string> = { ok: 'text-muted', soon: 'text-warn', overdue: 'text-danger' };
export const LEVEL_LABEL: Record<ReminderLevel, string> = { ok: 'Em dia', soon: 'Em breve', overdue: 'Vencido' };
export const LEVEL_BADGE: Record<ReminderLevel, string> = {
  ok: 'bg-bg text-muted',
  soon: 'bg-warn-bg text-warn',
  overdue: 'bg-danger-bg text-danger',
};
export const badge = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold';

/** ícone por tipo de veículo (SVG, nunca emoji) */
export const VEHICLE_ICON: Record<VehicleType, LucideIcon> = {
  carro: Car,
  moto: Motorbike,
  bike: Bike,
  caminhao: Truck,
  outro: CarFront,
};
