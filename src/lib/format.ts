import type { ReminderStatus } from './calc.ts';
const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (n: number) => brlFmt.format(n);

export const num = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const km = (n: number) => `${num(n)} km`;

export function date(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}


/** Aceita "5,49", "5.49", "1.234,56". Retorna null se vazio ou inválido. */
export function parseDecimal(s: string): number | null {
  let t = s.trim().replace(/\s|R\$/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Inteiro ignorando separadores: "85.300" → 85300. */
export function parseInteger(s: string): number | null {
  const t = s.replace(/\D/g, '');
  return t ? Number(t) : null;
}

/** Número → texto para inputs ("5,49"). */
export function toInput(n: number | null | undefined, decimals?: number): string {
  if (n == null) return '';
  return decimals == null ? String(n).replace('.', ',') : n.toFixed(decimals).replace('.', ',');
}

/** "faltam 1.200 km · faltam 45 dias", "passou 300 km · vence hoje"… */
export function dueText(s: ReminderStatus): string {
  const parts: string[] = [];
  if (s.kmLeft != null) parts.push(s.kmLeft <= 0 ? `passou ${km(-s.kmLeft)}` : `faltam ${km(s.kmLeft)}`);
  if (s.daysLeft != null) {
    const d = s.daysLeft;
    parts.push(d < 0 ? `venceu há ${-d} dia${d === -1 ? '' : 's'}` : d === 0 ? 'vence hoje' : `faltam ${d} dia${d === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}
