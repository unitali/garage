import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { trackWrite } from './sync';
import type { CategoryKind, Data, Entry, EntrySeries, Reminder, UserPrefs, Vehicle } from './types';

// Estrutura:
//   users/{uid}/vehicles/{vid}
//   users/{uid}/vehicles/{vid}/entries/{id}     ← abastecimentos, serviços e despesas
//   users/{uid}/vehicles/{vid}/reminders/{id}

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
    alert(`Não foi possível salvar: ${err.message}`);
  });
}

export function saveVehicle(uid: string, vid: string | undefined, data: Data<Vehicle>): string {
  const ref = vid ? vehicleDoc(uid, vid) : doc(vehiclesCol(uid));
  fire(setDoc(ref, data, { merge: true }));
  return ref.id;
}

export function syncVehicleOdometer(uid: string, vid: string, odometer: number) {
  fire(updateDoc(vehicleDoc(uid, vid), { odometer }));
}

export async function deleteVehicle(uid: string, vid: string) {
  const [entries, reminders] = await Promise.all([getDocs(entriesCol(uid, vid)), getDocs(remindersCol(uid, vid))]);
  const refs = [...entries.docs, ...reminders.docs].map((d) => d.ref);
  // Firestore não apaga subcoleções sozinho; lotes de até 500 operações
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    fire(batch.commit());
  }
  fire(deleteDoc(vehicleDoc(uid, vid)));
}

export function saveEntry(uid: string, vid: string, id: string | undefined, data: Data<Entry>) {
  const ref = id ? doc(entriesCol(uid, vid), id) : doc(entriesCol(uid, vid));
  fire(setDoc(ref, data));
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

export function saveReminder(uid: string, vid: string, id: string | undefined, data: Data<Reminder>) {
  const ref = id ? doc(remindersCol(uid, vid), id) : doc(remindersCol(uid, vid));
  fire(setDoc(ref, data));
  return ref.id;
}

export function markReminderDone(uid: string, vid: string, id: string, lastKm: number, lastDate: string) {
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
