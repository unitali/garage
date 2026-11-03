import { generatePath } from 'react-router-dom';
import type { EntryKind } from '../types';

// Caminhos das telas. Fica separado de index.ts (que importa as telas) para as telas poderem
// importar daqui sem dependência circular.

/** abas da tela inicial (veículo selecionado); sem `tab` na URL abre o Histórico */
export type VehicleTab = 'historico' | 'resumo' | 'despesas' | 'lembretes';

/** Padrões que o React Router casa com a URL. */
export const PATTERNS = {
  home: '/',
  profile: '/perfil',
  newVehicle: '/v/new',
  vehicle: '/v/:vid',
  editVehicle: '/v/:vid/edit',
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
  home: (tab?: VehicleTab) => withQuery(PATTERNS.home, { tab }),
  profile: () => PATTERNS.profile,
  newVehicle: () => PATTERNS.newVehicle,
  /** seleciona o veículo e abre a tela inicial na aba */
  vehicle: (vid: string, tab?: VehicleTab) => withQuery(generatePath(PATTERNS.vehicle, { vid }), { tab }),
  editVehicle: (vid: string) => generatePath(PATTERNS.editVehicle, { vid }),
  newEntry: (vid: string, kind?: EntryKind) => withQuery(generatePath(PATTERNS.newEntry, { vid }), { kind }),
  entry: (vid: string, eid: string) => generatePath(PATTERNS.entry, { vid, eid }),
  newReminder: (vid: string) => generatePath(PATTERNS.newReminder, { vid }),
  reminder: (vid: string, rid: string) => generatePath(PATTERNS.reminder, { vid, rid }),
};
