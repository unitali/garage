import { onSnapshot, orderBy, query, type DocumentReference, type Query } from 'firebase/firestore';
import { entriesCol, remindersCol, userDoc, vehiclesCol } from '../db';
import { createStore, useStore, type Store } from '../lib/store';
import type { Entry, Reminder, UserPrefs, Vehicle } from '../types';
import { DEFAULT_ALERT, type AlertWindow } from '../lib/calc';

interface Live<T> {
  data: T;
  loading: boolean;
}

// Dados em memória: uma assinatura por consulta, aberta na primeira vez que alguma tela precisa dela
// e compartilhada por todas. Ela continua aberta ao trocar de tela (os dados já estão aqui, sem
// "Carregando…" nem nova leitura) e só fecha ao sair da conta (stopLive). O Firestore manda apenas
// o que mudou depois da primeira carga.
const sources = new Map<string, { store: Store<Live<unknown>>; stop: () => void }>();

function source<T>(key: string, empty: T, start: (set: (data: T) => void) => () => void): Store<Live<T>> {
  let s = sources.get(key);
  if (!s) {
    const store = createStore<Live<unknown>>({ data: empty, loading: true });
    s = { store, stop: start((data) => store.set({ data, loading: false })) };
    sources.set(key, s);
  }
  return s.store as Store<Live<T>>;
}

/** Fecha todas as assinaturas e esquece os dados (ao sair da conta). */
export function stopLive() {
  for (const s of sources.values()) s.stop();
  sources.clear();
}

// sem veículo selecionado: vazio e já "carregado"
const IDLE_LIST = createStore<Live<never[]>>({ data: [], loading: false });

function useLiveQuery<T>(key: string | null, make: () => Query): Live<T[]> {
  const store = key
    ? source<T[]>(key, [], (set) =>
        onSnapshot(
          make(),
          (snap) => set(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T)),
          (err) => {
            console.error(err);
            set([]);
          },
        ),
      )
    : IDLE_LIST;
  return useStore(store as Store<Live<T[]>>);
}

function useLiveDoc<T>(key: string, make: () => DocumentReference): Live<T | null> {
  const store = source<T | null>(key, null, (set) =>
    onSnapshot(
      make(),
      (snap) => set(snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null),
      (err) => {
        console.error(err);
        set(null);
      },
    ),
  );
  return useStore(store);
}

export const useVehicles = (uid: string) =>
  useLiveQuery<Vehicle>(`vehicles/${uid}`, () => query(vehiclesCol(uid), orderBy('createdAt')));

/** Um veículo, da lista já carregada (sem assinatura própria). */
export function useVehicle(uid: string, vid?: string): Live<Vehicle | null> {
  const { data, loading } = useVehicles(uid);
  return { data: data.find((v) => v.id === vid) ?? null, loading };
}

export const useEntries = (uid: string, vid?: string) =>
  useLiveQuery<Entry>(vid ? `entries/${uid}/${vid}` : null, () => query(entriesCol(uid, vid!), orderBy('date', 'desc')));

export const useReminders = (uid: string, vid?: string) =>
  useLiveQuery<Reminder>(vid ? `reminders/${uid}/${vid}` : null, () => remindersCol(uid, vid!));

/** Preferências da conta (users/{uid}), como os tipos de serviço/despesa personalizados. */
export const useUserPrefs = (uid: string) => useLiveDoc<UserPrefs>(`prefs/${uid}`, () => userDoc(uid));

/** Janelas de aviso e de urgência dos lembretes da conta, com o padrão quando não configuradas. */
export function useAlertWindow(uid: string): AlertWindow {
  const { data } = useUserPrefs(uid);
  return {
    km: data?.alertKm ?? DEFAULT_ALERT.km,
    days: data?.alertDays ?? (data?.alertMonths ? data.alertMonths * 30 : DEFAULT_ALERT.days),
    urgentKm: data?.urgentKm ?? DEFAULT_ALERT.urgentKm,
    urgentDays: data?.urgentDays ?? DEFAULT_ALERT.urgentDays,
  };
}
