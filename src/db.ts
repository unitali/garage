import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { trackWrite } from './sync';
import { sameDoc } from './lib/same';
import { BACKUP_DAYS, BACKUPS_PER_DAY, backupData, backupId, MAX_BACKUP_DOCS } from './lib/backup';
import type { CategoryKind, Data, Entry, EntrySeries, Reminder, UserPrefs, Vehicle } from './types';
import { notify } from './dialog';

// Estrutura:
//   users/{uid}/vehicles/{vid}
//   users/{uid}/vehicles/{vid}/entries/{id}     ← abastecimentos, serviços e despesas
//   users/{uid}/vehicles/{vid}/reminders/{id}
//   trash/{uid}/backups/{bid}/docs/{n}        ← cópia ao excluir a conta (o app só cria; expira em 90 dias;
//                                               restaurar: scripts/restore-account.mjs)

export const userDoc = (uid: string) => doc(db, 'users', uid);
export const vehiclesCol = (uid: string) => collection(db, 'users', uid, 'vehicles');
export const vehicleDoc = (uid: string, vid: string) => doc(db, 'users', uid, 'vehicles', vid);
export const entriesCol = (uid: string, vid: string) => collection(db, 'users', uid, 'vehicles', vid, 'entries');
export const remindersCol = (uid: string, vid: string) => collection(db, 'users', uid, 'vehicles', vid, 'reminders');

/**
 * Com o cache offline, a promise de escrita só resolve quando o servidor confirma.
 * A gravação local é imediata, então não esperamos: a UI segue e o Firestore sincroniza depois.
 */
function fire(p: Promise<unknown>) {
  trackWrite(p);
  p.catch((err: Error) => {
    console.error(err);
    notify('Não foi possível salvar', err.message);
  });
}

// `prev` (o documento como está): salvar sem mudar nada não grava.

export function saveVehicle(uid: string, vid: string | undefined, data: Data<Vehicle>, prev?: Vehicle | null): string {
  const ref = vid ? vehicleDoc(uid, vid) : doc(vehiclesCol(uid));
  if (!sameDoc(prev, data, true)) fire(setDoc(ref, data, { merge: true }));
  return ref.id;
}

export function syncVehicleOdometer(uid: string, vid: string, odometer: number) {
  fire(updateDoc(vehicleDoc(uid, vid), { odometer }));
}

/**
 * Exclui o veículo e tudo dele. O Firestore não apaga subcoleções sozinho: lê do servidor (sem rede,
 * falha antes de apagar — o cache do aparelho pode não ter tudo e sobrariam registros órfãos) e
 * apaga em lotes, o veículo por último.
 */
export async function deleteVehicle(uid: string, vid: string) {
  const [entries, reminders] = await Promise.all([getDocsFromServer(entriesCol(uid, vid)), getDocsFromServer(remindersCol(uid, vid))]);
  const refs = [...entries.docs, ...reminders.docs].map((d) => d.ref);
  await inBatches([...refs, vehicleDoc(uid, vid)], (batch, ref) => batch.delete(ref));
}

export function saveEntry(uid: string, vid: string, id: string | undefined, data: Data<Entry>, prev?: Entry | null) {
  const ref = id ? doc(entriesCol(uid, vid), id) : doc(entriesCol(uid, vid));
  if (!sameDoc(prev, data)) fire(setDoc(ref, data));
  return ref.id;
}

/** Várias despesas de uma vez (parcelas/recorrência), ligadas por `series.id`: uma gravação só. */
export function saveEntrySeries(uid: string, vid: string, list: (Omit<Data<Entry>, 'series'> & { series: Omit<EntrySeries, 'id'> })[]) {
  const seriesId = doc(entriesCol(uid, vid)).id;
  const batch = writeBatch(db);
  for (const e of list) batch.set(doc(entriesCol(uid, vid)), { ...e, series: { ...e.series, id: seriesId } });
  fire(batch.commit());
}

/** Exclui várias de uma vez (ex: todas as parcelas). */
export function deleteEntries(uid: string, vid: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(entriesCol(uid, vid), id)));
  fire(batch.commit());
}

/** Conta paga (ou desfeito): sai dos lembretes do mês. */
export function markPaid(uid: string, vid: string, id: string, paid = true) {
  fire(updateDoc(doc(entriesCol(uid, vid), id), { paid }));
}

export function deleteEntry(uid: string, vid: string, id: string) {
  fire(deleteDoc(doc(entriesCol(uid, vid), id)));
}

export function saveReminder(uid: string, vid: string, id: string | undefined, data: Data<Reminder>, prev?: Reminder | null) {
  const ref = id ? doc(remindersCol(uid, vid), id) : doc(remindersCol(uid, vid));
  if (!sameDoc(prev, data)) fire(setDoc(ref, data));
  return ref.id;
}

export function markReminderDone(uid: string, vid: string, id: string, lastKm: number, lastDate: string, prev?: Reminder | null) {
  if (prev?.lastKm === lastKm && prev.lastDate === lastDate) return; // já está feito com esses valores
  fire(updateDoc(doc(remindersCol(uid, vid), id), { lastKm, lastDate }));
}

export function deleteReminder(uid: string, vid: string, id: string) {
  fire(deleteDoc(doc(remindersCol(uid, vid), id)));
}

const CATEGORY_FIELD: Record<CategoryKind, 'serviceCategories' | 'expenseCategories'> = {
  service: 'serviceCategories',
  expense: 'expenseCategories',
};

/** Tipo de serviço/despesa criado pelo usuário (fica em users/{uid}, vale em todos os veículos). */
export function addCategory(uid: string, kind: CategoryKind, name: string) {
  fire(setDoc(userDoc(uid), { [CATEGORY_FIELD[kind]]: arrayUnion(name) }, { merge: true }));
}

/** Remove da lista; registros que já usam o tipo continuam com ele. */
export function removeCategory(uid: string, kind: CategoryKind, name: string) {
  fire(setDoc(userDoc(uid), { [CATEGORY_FIELD[kind]]: arrayRemove(name) }, { merge: true }));
}

/** Preferências da conta (users/{uid}), mescladas com as que já existem. */
export function savePrefs(uid: string, patch: Partial<UserPrefs>) {
  fire(setDoc(userDoc(uid), patch, { merge: true }));
}

// ---------- excluir conta ----------

/** Lotes de até 500 operações (limite do Firestore), esperando cada um ser confirmado pelo servidor. */
async function inBatches<T>(items: T[], apply: (batch: ReturnType<typeof writeBatch>, item: T) => void) {
  for (let i = 0; i < items.length; i += 450) {
    const batch = writeBatch(db);
    items.slice(i, i + 450).forEach((item) => apply(batch, item));
    await batch.commit();
  }
}

/**
 * Excluir conta: copia tudo de users/{uid} para trash/{uid}/backups/{bid} e só depois apaga.
 * Lê do servidor e espera cada gravação (sem rede, falha antes de apagar qualquer coisa). Se cair no
 * meio, nada se perde: a cópia vem primeiro, e a restauração confere se ela tem todos os documentos
 * que a capa declara. Cada documento guarda o caminho relativo (`vehicles/x/entries/y`) e os dados.
 * Limites e expiração da cópia: src/lib/backup.ts e firestore.rules.
 */
export async function deleteAccount(uid: string, who: { email: string | null; name: string | null }) {
  const profile = await getDocFromServer(userDoc(uid));
  const vehicles = await getDocsFromServer(vehiclesCol(uid));
  const children = await Promise.all(
    vehicles.docs.map((v) => Promise.all([getDocsFromServer(entriesCol(uid, v.id)), getDocsFromServer(remindersCol(uid, v.id))])),
  );
  const leaves = children.flat().flatMap((s) => s.docs);
  // ordem de exclusão: filhos antes dos pais
  const all: DocumentSnapshot[] = [...leaves, ...vehicles.docs, ...(profile.exists() ? [profile] : [])];
  if (all.length === 0) return; // nada a guardar (ex: segunda tentativa depois de os dados já terem saído)
  if (all.length > MAX_BACKUP_DOCS) throw new Error(`Conta com ${all.length} documentos: acima do limite da cópia.`);

  // capa primeiro: as regras só aceitam documentos numerados abaixo do total que ela declara
  const now = new Date();
  const expireAt = Timestamp.fromMillis(now.getTime() + BACKUP_DAYS * 86_400_000);
  const backup = await createBackupCover(uid, now, { uid, email: who.email, name: who.name, deletedAt: now.getTime(), docs: all.length, expireAt });
  const root = userDoc(uid).path;
  await inBatches(
    all.map((d, i) => ({ d, i })),
    (batch, { d, i }) => {
      const path = d.ref.path.slice(root.length + 1) || '.';
      batch.set(doc(backup, 'docs', String(i)), { path, data: backupData(path, d.data() ?? {}), expireAt });
    },
  );

  await inBatches(
    all.map((d) => d.ref),
    (batch, ref: DocumentReference) => batch.delete(ref),
  );
}

/** Cria a capa com o primeiro id livre do dia ("AAAAMMDD-1", "-2", "-3"): as regras recusam id já usado. */
async function createBackupCover(uid: string, now: Date, data: Record<string, unknown>) {
  for (let n = 1; ; n++) {
    const ref = doc(db, 'trash', uid, 'backups', backupId(now, n));
    try {
      await setDoc(ref, data);
      return ref;
    } catch (err) {
      if ((err as { code?: string }).code !== 'permission-denied' || n === BACKUPS_PER_DAY) throw err;
    }
  }
}
