import type { CategoryKind, EntryKind, VehicleType } from './types';

export const VEHICLE_TYPES: Record<VehicleType, { label: string; icon: string }> = {
  carro: { label: 'Carro', icon: '🚗' },
  moto: { label: 'Moto / scooter', icon: '🛵' },
  bike: { label: 'Bike elétrica', icon: '🚲' },
  caminhao: { label: 'Caminhão / van', icon: '🚚' },
  outro: { label: 'Outro', icon: '🚙' },
};

// ícone e cor de cada tipo ficam em ui.ts (KIND_ICON, KIND_BORDER…)
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
