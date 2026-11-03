import type { CategoryKind, EntryKind, VehicleType } from './types';

// ícone de cada tipo fica em ui.ts (VEHICLE_ICON)
export const VEHICLE_TYPES: Record<VehicleType, { label: string }> = {
  carro: { label: 'Carro' },
  moto: { label: 'Moto / scooter' },
  bike: { label: 'Bike elétrica' },
  caminhao: { label: 'Caminhão / van' },
  outro: { label: 'Outro' },
}

// ícone e cor de cada tipo ficam em ui.ts (KIND_ICON, KIND_SOFT)
export const ENTRY_KINDS: Record<EntryKind, { label: string; plural: string }> = {
  fuel: { label: 'Abastecimento', plural: 'Abastecimentos' },
  service: { label: 'Serviço', plural: 'Serviços' },
  expense: { label: 'Despesa', plural: 'Despesas' },
};

export const FUEL_TYPES = ['Gasolina', 'Etanol', 'Diesel', 'GNV', 'Recarga elétrica'];

export const SERVICE_CATEGORIES = [
  'Troca de óleo',
  'Filtros',
  'Revisão',
  'Pneus',
  'Alinhamento / balanceamento',
  'Freios',
  'Bateria',
  'Correia',
  'Suspensão',
  'Elétrica',
  'Ar-condicionado',
  'Lavagem',
  'Embreagem',
  "Bomba d'água",
  'Mão de obra',
  'Outro',
];

export const EXPENSE_CATEGORIES = [
  'IPVA',
  'Licenciamento',
  'Seguro',
  'Multa',
  'Estacionamento',
  'Pedágio',
  'Financiamento',
  'Acessórios',
  'Outro',
];

export const REMINDER_PRESETS: { title: string; intervalKm: number | null; intervalMonths: number | null }[] = [
  { title: 'Troca de óleo', intervalKm: 10000, intervalMonths: 12 },
  { title: 'Filtro de ar', intervalKm: 10000, intervalMonths: 12 },
  { title: 'Rodízio de pneus', intervalKm: 10000, intervalMonths: null },
  { title: 'Alinhamento / balanceamento', intervalKm: 10000, intervalMonths: 12 },
  { title: 'Revisão', intervalKm: 10000, intervalMonths: 12 },
  { title: 'Fluido de freio', intervalKm: null, intervalMonths: 24 },
  { title: 'Correia dentada', intervalKm: 50000, intervalMonths: 48 },
  { title: 'Licenciamento', intervalKm: null, intervalMonths: 12 },
  { title: 'IPVA', intervalKm: null, intervalMonths: 12 },
  { title: 'Seguro', intervalKm: null, intervalMonths: 12 },
];

export const DEFAULT_CATEGORIES: Record<CategoryKind, string[]> = {
  service: SERVICE_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

const OTHER = 'Outro';

/** Para comparar nomes de tipo: "  troca  DE óleo" ≡ "Troca de óleo". */
export const normalizeCategory = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

/**
 * Opções do select: padrões, depois os personalizados em ordem alfabética, "Outro" sempre por último.
 * `current` (o tipo de um registro antigo) entra na lista mesmo que tenha sido removido. Sem repetidos.
 */
export function categoryOptions(defaults: string[], custom: string[] = [], current?: string): string[] {
  const base = defaults.filter((c) => c !== OTHER);
  const seen = new Set(base.map(normalizeCategory));
  const extra = [...custom, ...(current ? [current] : [])]
    .filter((c) => {
      const key = normalizeCategory(c);
      if (!key || seen.has(key) || key === normalizeCategory(OTHER)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return [...base, ...extra, ...(defaults.includes(OTHER) ? [OTHER] : [])];
}

/** Troca de óleo: ao registrar, escolhe-se o intervalo da próxima e o lembrete é criado/atualizado. */
export const OIL_CHANGE = 'Troca de óleo';
export const OIL_KM_OPTIONS = [5000, 10000, 15000];
export const OIL_MONTH_OPTIONS = [6, 12, 18];

/** Antecedência do aviso de lembrete (Configurações → Lembretes). */
export const ALERT_KM_OPTIONS = [500, 1000, 2000, 5000];
export const ALERT_MONTH_OPTIONS = [1, 2, 3];
export const URGENT_KM_OPTIONS = [100, 200, 500, 1000];
export const URGENT_DAY_OPTIONS = [3, 7, 15, 30];
