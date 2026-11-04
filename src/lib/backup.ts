// Formato da cópia guardada ao excluir a conta (trash/{uid}/backups/{bid}/docs/{n}).
// Espelha os limites de firestore.rules: se mudar aqui, mude lá (e vice-versa).

/** no máximo 3 cópias por dia: ids "AAAAMMDD-1" a "AAAAMMDD-3" */
export const BACKUPS_PER_DAY = 3;
/** documentos por cópia (perfil + veículos + registros + lembretes) */
export const MAX_BACKUP_DOCS = 5000;
/** a cópia é apagada sozinha depois disso (política de TTL do Firestore no campo expireAt) */
export const BACKUP_DAYS = 90;

/** Campos que o app conhece em cada tipo de documento (os mesmos que as regras aceitam). */
const FIELDS = {
  prefs: ['serviceCategories', 'expenseCategories', 'alertKm', 'alertDays', 'alertMonths', 'urgentKm', 'urgentDays'],
  vehicles: ['name', 'type', 'plate', 'initialOdometer', 'odometer', 'createdAt'],
  entries: ['kind', 'date', 'odometer', 'amount', 'category', 'description', 'notes', 'createdAt', 'fuelType', 'liters',
    'pricePerLiter', 'fullTank', 'title', 'items', 'series', 'paid'],
  reminders: ['title', 'intervalKm', 'intervalMonths', 'lastKm', 'lastDate', 'createdAt'],
} as const;

const ID = '[A-Za-z0-9_-]{1,40}';
const PATHS: [RegExp, keyof typeof FIELDS][] = [
  [new RegExp(`^vehicles/${ID}$`), 'vehicles'],
  [new RegExp(`^vehicles/${ID}/entries/${ID}$`), 'entries'],
  [new RegExp(`^vehicles/${ID}/reminders/${ID}$`), 'reminders'],
];

/** Tipo do documento pelo caminho relativo a users/{uid} ("." = o próprio perfil); null se não for do app. */
export function backupKind(path: string): keyof typeof FIELDS | null {
  if (path === '.') return 'prefs';
  return PATHS.find(([re]) => re.test(path))?.[1] ?? null;
}

/** Só os campos que o app usa: campos antigos, que nenhuma tela lê mais, ficam de fora da cópia. */
export function backupData(path: string, data: Record<string, unknown>): Record<string, unknown> {
  const kind = backupKind(path);
  if (!kind) throw new Error(`Caminho fora do app: ${path}`);
  const keys: readonly string[] = FIELDS[kind];
  return Object.fromEntries(Object.entries(data).filter(([k]) => keys.includes(k)));
}

/** Id da cópia: data de hoje em UTC (a mesma que as regras conferem) + número da cópia no dia. */
export function backupId(now: Date, n: number): string {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `${day}-${n}`;
}
