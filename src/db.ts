import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { trackWrite } from './sync';
import type { Data, Entry, Reminder, Vehicle } from './types';

// Estrutura:
//   users/{uid}/vehicles/{vid}
//   users/{uid}/vehicles/{vid}/entries/{id}     ← abastecimentos, serviços e despesas
//   users/{uid}/vehicles/{vid}/reminders/{id}

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
