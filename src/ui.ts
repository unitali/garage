import { Bell, Bike, Car, CarFront, Fuel, Motorbike, Receipt, Truck, Wrench, type LucideIcon } from 'lucide-react';
import type { ReminderLevel } from './lib/calc';
import type { Entry, EntryKind, VehicleType } from './types';

// Classes Tailwind repetidas em várias telas. Cores da paleta do Tailwind com a variante dark:; só a marca
// (brand, bar, flag) vem dos tokens (src/styles/tokens.css).
// Regras: alvos de toque ≥ 44px (min-h-11), cards com raio 16 e padding 14, sem borda colorida à esquerda.

export const splash = 'grid min-h-dvh place-items-center text-slate-600 dark:text-slate-400';
export const main = 'px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))]';
export const emptyText = 'my-4 text-center text-slate-600 dark:text-slate-400';
export const sectionTitle = 'mb-2 text-base font-bold';

export const card = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs dark:shadow-none';
export const cardRow = `${card} flex items-center gap-3`;
export const list = 'mb-4 flex flex-col gap-3';
export const grow = 'flex min-w-0 flex-1 flex-col gap-0.5';
export const avatarSmall = 'grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg';

const BTN_VARIANTS = {
  default: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
  primary: 'border-brand bg-brand text-brand-contrast',
  danger: 'border-slate-200 dark:border-slate-800 bg-transparent text-red-700 dark:text-red-400',
  /** ação irreversível: vermelho com letras brancas */
  destructive: 'border-red-700 dark:border-red-400 bg-red-700 dark:bg-red-400 text-white',
};
const BTN_SIZES = { md: 'px-4 py-3', sm: 'px-3 py-2 text-sm' };

export const btn = (variant: keyof typeof BTN_VARIANTS = 'default', size: keyof typeof BTN_SIZES = 'md') =>
  `inline-flex min-h-11 items-center justify-center rounded-xl border font-semibold disabled:opacity-60 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}`;

/** chips quebram linha (nada cortado em telas estreitas) */
export const chips = 'flex flex-wrap gap-2';
export const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
    active ? 'border-brand bg-brand text-brand-contrast' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
  }`;

// ---------- formulários ----------

export const form = 'flex flex-col gap-3.5';
export const grid2 = 'grid grid-cols-2 gap-3';
export const field = 'flex flex-col gap-1.5 text-sm font-semibold';
/** "(opcional)" na mesma linha do rótulo — `contents` evita virar um item do flex em coluna */
export const opt = 'contents font-normal text-slate-600 dark:text-slate-400';
export const hint = 'text-xs font-normal text-slate-600 dark:text-slate-400';
export const input =
  'min-h-11 w-full min-w-0 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-base font-normal text-slate-900 dark:text-slate-100 focus:outline-2 focus:-outline-offset-1 focus:outline-brand';
export const checkField = 'flex items-start gap-2.5 text-sm font-semibold';
export const checkbox = 'm-0 size-5 shrink-0 accent-brand';
export const fieldset = 'flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 px-3 pt-2.5 pb-3';
export const legend = 'px-1 text-sm font-bold';
export const error = 'text-red-700 dark:text-red-400';

// ---------- tipo de registro: só no ícone (combustível verde, serviço laranja, despesa azul, lembrete roxo) ----------

export const KIND_ICON: Record<EntryKind, LucideIcon> = { fuel: Fuel, service: Wrench, expense: Receipt };
/** círculo do ícone: fundo claro + ícone na cor do tipo */
export const KIND_SOFT: Record<EntryKind, string> = {
  fuel: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
  service: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
  expense: 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
};

/** abastecimento pela cor do combustível: gasolina vermelha, etanol verde; os outros na cor do tipo */
export const FUEL_SOFT: Record<string, string> = { Gasolina: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400', Etanol: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' };
export const FUEL_TEXT: Record<string, string> = { Gasolina: 'text-red-700 dark:text-red-400', Etanol: 'text-emerald-700 dark:text-emerald-400' };
/** círculo do ícone de um registro (abastecimento pelo combustível, o resto pelo tipo) */
export const entrySoft = (e: Pick<Entry, 'kind' | 'fuelType'>) =>
  (e.kind === 'fuel' && e.fuelType && FUEL_SOFT[e.fuelType]) || KIND_SOFT[e.kind];
export const REMINDER_ICON = Bell;
export const REMINDER_SOFT = 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300';
export const iconCircle = 'grid size-10 shrink-0 place-items-center rounded-full';

// ---------- status: vermelho vencido, amarelo próximo (janela urgente), verde/neutro em dia ----------

export const LEVEL_TEXT: Record<ReminderLevel, string> = { ok: 'text-slate-600 dark:text-slate-400', soon: 'text-amber-700 dark:text-amber-400', overdue: 'text-red-700 dark:text-red-400' };
export const LEVEL_LABEL: Record<ReminderLevel, string> = { ok: 'Em dia', soon: 'Próximo', overdue: 'Vencido' };
export const LEVEL_BADGE: Record<ReminderLevel, string> = {
  ok: 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400',
  soon: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400',
  overdue: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400',
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
