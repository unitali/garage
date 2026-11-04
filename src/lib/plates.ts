// Placas por país: cada formato diz o que vai em cada posição (L = letra, N = número) e onde entra o hífen.
// Para outro país, basta uma entrada nova em PLATE_COUNTRIES (e, se quiser, o país no cadastro do veículo).

export interface PlateFormat {
  label: string;
  example: string;
  /** uma letra por posição, sem separador: L = letra, N = número */
  slots: string;
  /** posições (no texto sem separador) antes das quais entra um hífen */
  dashAt?: number[];
}

interface PlateCountry {
  name: string;
  formats: PlateFormat[];
}

export const PLATE_COUNTRIES = {
  BR: {
    name: 'Brasil',
    formats: [
      { label: 'Mercosul', example: 'ABC1D23', slots: 'LLLNLNN' },
      { label: 'antiga', example: 'ABC-1234', slots: 'LLLNNNN', dashAt: [3] },
    ],
  },
} satisfies Record<string, PlateCountry>;

export type PlateCountryCode = keyof typeof PLATE_COUNTRIES;

const fits = (slot: string, ch: string) => (slot === 'L' ? /[A-Z]/.test(ch) : /[0-9]/.test(ch));
const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** formatos que ainda servem para o que foi digitado (`raw` sem separador) */
function candidates(raw: string, formats: PlateFormat[]) {
  return formats.filter((f) => raw.length <= f.slots.length && [...raw].every((c, i) => fits(f.slots[i], c)));
}

/**
 * Máscara ao digitar: maiúsculas, só o que cabe em algum formato do país e o hífen quando o formato
 * já está definido ("ABC1" serve para os dois; "ABC12" só para a antiga → "ABC-12").
 */
export function maskPlate(value: string, country: PlateCountryCode = 'BR'): string {
  const formats = PLATE_COUNTRIES[country].formats;
  let raw = '';
  for (const ch of clean(value)) if (candidates(raw + ch, formats).length) raw += ch;
  const only = candidates(raw, formats);
  const dashes = only.length === 1 ? (only[0].dashAt ?? []) : [];
  return [...raw].map((c, i) => (dashes.includes(i) ? '-' : '') + c).join('');
}

/** Formato da placa completa (null se incompleta ou inválida). */
export function plateFormat(value: string, country: PlateCountryCode = 'BR'): PlateFormat | null {
  const raw = clean(value);
  return candidates(raw, PLATE_COUNTRIES[country].formats).find((f) => f.slots.length === raw.length) ?? null;
}

/** "Mercosul (ABC1D23) ou antiga (ABC-1234)" */
export const plateHint = (country: PlateCountryCode = 'BR') =>
  PLATE_COUNTRIES[country].formats.map((f) => `${f.label} (${f.example})`).join(' ou ');

/** maior tamanho possível já com hífen (para o maxLength do campo) */
export const plateMaxLength = (country: PlateCountryCode = 'BR') =>
  Math.max(...PLATE_COUNTRIES[country].formats.map((f) => f.slots.length + (f.dashAt?.length ?? 0)));
