import { Fuel, Receipt, Wrench, type LucideIcon } from 'lucide-react';
import type { ReminderLevel } from './lib/calc';
import type { EntryKind } from './types';

// Classes Tailwind repetidas em várias telas. Cores vêm dos tokens em styles.css.

export const splash = 'grid min-h-dvh place-items-center text-muted';
export const main = 'px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))]';
export const mainWithFab = 'px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))]';
export const emptyText = 'my-4 text-center text-muted';
export const sectionTitle = 'mb-2 text-[0.95rem] font-bold';

export const card = 'rounded-2xl border border-line bg-surface p-3.5 shadow-xs dark:shadow-none';
export const cardRow = `${card} flex items-center gap-3`;
export const list = 'mb-4 flex flex-col gap-2';
export const grow = 'flex min-w-0 flex-1 flex-col gap-0.5';
export const avatarSmall = 'grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg';

const BTN_VARIANTS = {
  default: 'border-line bg-surface',
  primary: 'border-brand bg-brand text-brand-contrast',
  danger: 'border-line bg-transparent text-danger',
};
const BTN_SIZES = { md: 'px-4 py-3', sm: 'px-3 py-2 text-sm' };

export const btn = (variant: keyof typeof BTN_VARIANTS = 'default', size: keyof typeof BTN_SIZES = 'md') =>
  `inline-flex items-center justify-center rounded-xl border font-semibold disabled:opacity-60 ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}`;

export const chips = 'flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]';
export const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
    active ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'
  }`;

// ---------- formulários ----------

export const form = 'flex flex-col gap-3.5';
export const grid2 = 'grid grid-cols-2 gap-3';
export const field = 'flex flex-col gap-1.5 text-sm font-semibold';
/** "(opcional)" na mesma linha do rótulo — `contents` evita virar um item do flex em coluna */
export const opt = 'contents font-normal text-muted';
export const hint = 'text-xs font-normal text-muted';
export const input =
  'w-full min-w-0 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-base font-normal text-ink focus:outline-2 focus:-outline-offset-1 focus:outline-brand';
export const checkField = 'flex items-start gap-2.5 text-sm font-semibold';
export const checkbox = 'm-0 size-5 shrink-0 accent-brand';
export const fieldset = 'flex flex-col gap-2 rounded-2xl border border-line px-3 pt-2.5 pb-3';
export const legend = 'px-1 text-sm font-bold';
export const error = 'text-danger';

// ---------- botão flutuante ----------

// A coluna do app tem no máximo 768px (max-w-3xl): o botão acompanha a borda direita dela.
// Fica acima da barra de atalhos (64px + área segura).
const fabRight = 'right-[max(20px,calc(50vw-364px))]';
export const fab = `fixed ${fabRight} bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 grid size-15 place-items-center rounded-full bg-brand text-[2rem] leading-none text-brand-contrast shadow-[0_6px_16px_rgb(0_0_0/25%)] transition-transform`;

// ---------- tipos de registro: ícone e cor (abastecimento amarelo, serviço azul, despesa vermelho) ----------

export const KIND_ICON: Record<EntryKind, LucideIcon> = { fuel: Fuel, service: Wrench, expense: Receipt };
export const KIND_BORDER: Record<EntryKind, string> = {
  fuel: 'border-l-fuel',
  service: 'border-l-service',
  expense: 'border-l-expense',
};
/** círculo do ícone: fundo claro + ícone na cor do tipo */
export const KIND_SOFT: Record<EntryKind, string> = {
  fuel: 'bg-fuel/15 text-fuel',
  service: 'bg-service/15 text-service',
  expense: 'bg-expense/15 text-expense',
};
export const KIND_TEXT: Record<EntryKind, string> = { fuel: 'text-fuel', service: 'text-service', expense: 'text-expense' };

// ---------- status dos lembretes ----------

// lembretes: verde (em dia) · laranja (urgente) · vermelho (vencido)
export const LEVEL_TEXT: Record<ReminderLevel, string> = { ok: 'text-ok', soon: 'text-warn', overdue: 'text-danger' };
export const LEVEL_DOT: Record<ReminderLevel, string> = { ok: 'bg-ok', soon: 'bg-warn', overdue: 'bg-danger' };
export const LEVEL_LABEL: Record<ReminderLevel, string> = { ok: 'Em dia', soon: 'Urgente', overdue: 'Vencido' };
export const LEVEL_BADGE: Record<ReminderLevel, string> = {
  ok: 'bg-ok/15 text-ok',
  soon: 'bg-warn/15 text-warn',
  overdue: 'bg-danger/15 text-danger',
};
export const LEVEL_BORDER: Record<ReminderLevel, string> = {
  ok: 'border-l-ok',
  soon: 'border-l-warn',
  overdue: 'border-l-danger',
};
