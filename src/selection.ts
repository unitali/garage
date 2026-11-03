import { createStore, useStore } from './lib/store';
import type { Vehicle } from './types';

// Veículo escolhido no topo da tela inicial — vale também para os atalhos da barra de baixo.

const KEY = 'selected-vehicle';

function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const selected = createStore<string | null>(read());

export function selectVehicle(id: string) {
  selected.set(id);
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // sem storage: vale só nesta sessão
  }
}

/** Esquece o veículo escolhido (ao excluir a conta). */
export function clearSelectedVehicle() {
  selected.set(null);
  try {
    localStorage.removeItem(KEY);
  } catch {
    // sem storage: nada a limpar
  }
}

/** O veículo selecionado; se nunca escolheu ou ele foi excluído, o primeiro da lista. */
export function useSelectedVehicle(vehicles: Vehicle[]): Vehicle | null {
  const id = useStore(selected);
  return vehicles.find((v) => v.id === id) ?? vehicles[0] ?? null;
}
