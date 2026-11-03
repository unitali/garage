// Datas são guardadas como 'YYYY-MM-DD' (fuso local), o que deixa ordenar e comparar como string.

const pad = (n: number) => String(n).padStart(2, '0');

export function today(): string {
  return fromTimestamp(Date.now());
}

/** timestamp (ms) → 'YYYY-MM-DD' no fuso local */
export function fromTimestamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parts(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m, d];
}

export function addMonths(s: string, months: number): string {
  const [y, m, d] = parts(s);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(d, lastDay))}`;
}

export function addDays(s: string, days: number): string {
  const [y, m, d] = parts(s);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** dias de a até b (positivo se b é depois de a) */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}
