import { useSyncExternalStore } from 'react';

/** Valor observável mínimo, fora do React (para estado global do navegador/Firestore). */
export interface Store<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const useStore = <T,>(store: Store<T>) => useSyncExternalStore(store.subscribe, store.get);
