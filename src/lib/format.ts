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

/** Número → texto para inputs, no mesmo formato da máscara ("1.234,56"). */
export function toInput(n: number | null | undefined, decimals?: number): string {
  if (n == null) return '';
  return decimals == null ? String(n).replace('.', ',') : num(n, decimals);
}

// ---------- máscaras dos campos (aplicadas a cada tecla) ----------

/** km: até 999.999 */
export const MAX_KM_DIGITS = 6;
/** valores: até 9.999.999,99 */
const MAX_MONEY_DIGITS = 9;

/** Só dígitos, cortando no limite: "12a.34" → "1234". */
export function digitsOnly(s: string, max: number): string {
  return s.replace(/\D/g, '').slice(0, max);
}

export const maskKm = (s: string) => digitsOnly(s, MAX_KM_DIGITS);

/**
 * Valor com duas casas, preenchido da direita para a esquerda (como em app de banco):
 * "5" → "0,05", "549" → "5,49", "123456" → "1.234,56". Vazio continua vazio.
 */
export function maskMoney(s: string): string {
  const digits = s.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_MONEY_DIGITS);
  return digits ? num(Number(digits) / 100, 2) : '';
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
