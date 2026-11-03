import { generatePath } from 'react-router-dom';
import type { EntryKind } from '../types';

// Caminhos das telas. Fica separado de index.ts (que importa as telas) para as telas poderem
// importar daqui sem dependência circular.

/** destino ao "abrir" um veículo (/v/:vid?tab=…): os formulários voltam por aqui */
export type VehicleTab = 'historico' | 'resumo' | 'despesas' | 'lembretes';

/** filtro do histórico (?tipo=) */
export type HistoryFilter = 'abastecimento' | 'servico' | 'despesa';
export const FILTER_KIND: Record<HistoryFilter, EntryKind> = { abastecimento: 'fuel', servico: 'service', despesa: 'expense' };

/** Padrões que o React Router casa com a URL. */
export const PATTERNS = {
  home: '/',
  history: '/historico',
  reminders: '/lembretes',
  more: '/mais',
  calculator: '/calculadora',
  settings: '/config',
  profile: '/config/perfil',
  vehicles: '/config/veiculos',
  categories: '/config/categorias',
  reminderSettings: '/config/lembretes',
  newVehicle: '/v/new',
  vehicle: '/v/:vid',
  editVehicle: '/v/:vid/edit',
  odometer: '/v/:vid/km',
  newEntry: '/v/:vid/entry/new',
  entry: '/v/:vid/entry/:eid',
  newReminder: '/v/:vid/reminder/new',
  reminder: '/v/:vid/reminder/:rid',
} as const;

function withQuery(path: string, query: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(query).filter((kv): kv is [string, string] => !!kv[1])).toString();
  return qs ? `${path}?${qs}` : path;
}

/** URLs prontas para Link/navigate — nenhuma tela monta caminho na mão. */
export const paths = {
  home: () => PATTERNS.home,
  history: (tipo?: HistoryFilter) => withQuery(PATTERNS.history, { tipo }),
  reminders: () => PATTERNS.reminders,
  more: () => PATTERNS.more,
  calculator: () => PATTERNS.calculator,
  settings: () => PATTERNS.settings,
  profile: () => PATTERNS.profile,
  vehicles: () => PATTERNS.vehicles,
  categories: () => PATTERNS.categories,
  reminderSettings: () => PATTERNS.reminderSettings,
  newVehicle: () => PATTERNS.newVehicle,
  /** seleciona o veículo e abre a tela correspondente (histórico, lembretes…) */
  vehicle: (vid: string, tab?: VehicleTab) => withQuery(generatePath(PATTERNS.vehicle, { vid }), { tab }),
  editVehicle: (vid: string) => generatePath(PATTERNS.editVehicle, { vid }),
  odometer: (vid: string) => generatePath(PATTERNS.odometer, { vid }),
  /** `lembrete`: serviço já com o lembrete selecionado (card "Próxima manutenção") */
  newEntry: (vid: string, kind?: EntryKind, opts: { lembrete?: string } = {}) =>
    withQuery(generatePath(PATTERNS.newEntry, { vid }), { kind, lembrete: opts.lembrete }),
  entry: (vid: string, eid: string) => generatePath(PATTERNS.entry, { vid, eid }),
  newReminder: (vid: string) => generatePath(PATTERNS.newReminder, { vid }),
  reminder: (vid: string, rid: string) => generatePath(PATTERNS.reminder, { vid, rid }),
};
