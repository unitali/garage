import { useEffect, useState } from 'react';
import { onSnapshot, orderBy, query, type DocumentReference, type Query } from 'firebase/firestore';
import { entriesCol, remindersCol, userDoc, vehicleDoc, vehiclesCol } from './db';
import type { Entry, Reminder, UserPrefs, Vehicle } from './types';

interface Live<T> {
  data: T;
  loading: boolean;
}

/** Assina uma query em tempo real. `key` identifica a query (recria a assinatura quando muda). */
function useLiveQuery<T>(make: (() => Query) | null, key: string): Live<T[]> {
  const [state, setState] = useState<{ key: string } & Live<T[]>>({ key, data: [], loading: true });

  useEffect(() => {
    if (!make) return;
    return onSnapshot(
      make(),
      (snap) => setState({ key, loading: false, data: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T) }),
      (err) => {
        console.error(err);
        setState({ key, loading: false, data: [] });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!make) return { data: [], loading: false };
  return state.key === key ? state : { data: [], loading: true };
}

function useLiveDoc<T>(make: (() => DocumentReference) | null, key: string): Live<T | null> {
  const [state, setState] = useState<{ key: string } & Live<T | null>>({ key, data: null, loading: true });

  useEffect(() => {
    if (!make) return;
    return onSnapshot(
      make(),
      (snap) => setState({ key, loading: false, data: snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null }),
      (err) => {
        console.error(err);
        setState({ key, loading: false, data: null });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!make) return { data: null, loading: false };
  return state.key === key ? state : { data: null, loading: true };
}

export const useVehicles = (uid: string) =>
  useLiveQuery<Vehicle>(() => query(vehiclesCol(uid), orderBy('createdAt')), `vehicles/${uid}`);

export const useVehicle = (uid: string, vid?: string) =>
  useLiveDoc<Vehicle>(vid ? () => vehicleDoc(uid, vid) : null, `vehicle/${uid}/${vid}`);

export const useEntries = (uid: string, vid?: string) =>
  useLiveQuery<Entry>(vid ? () => query(entriesCol(uid, vid), orderBy('date', 'desc')) : null, `entries/${uid}/${vid}`);

export const useReminders = (uid: string, vid?: string) =>
  useLiveQuery<Reminder>(vid ? () => remindersCol(uid, vid) : null, `reminders/${uid}/${vid}`);

/** Preferências da conta (users/{uid}), como os tipos de serviço/despesa personalizados. */
export const useUserPrefs = (uid: string) => useLiveDoc<UserPrefs>(() => userDoc(uid), `prefs/${uid}`);
