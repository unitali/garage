import { doc, onSnapshot, waitForPendingWrites } from 'firebase/firestore';
import { db } from './firebase';
import { createStore, useStore } from './lib/store';

// As gravações vão primeiro para o cache local (IndexedDB) e o Firestore as envia quando há rede —
// inclusive depois de fechar e reabrir o app. Aqui só acompanhamos isso para mostrar na tela.

// navigator.onLine não é confiável (fica false com VPN, adaptadores virtuais, alguns PWAs no iOS).
// Quem diz se está conectado é o Firestore: snapshot com fromCache=false veio do servidor.
const online = createStore(true);
let offlineTimer: ReturnType<typeof setTimeout> | undefined;

// Atalho: o evento 'offline' é confiável quando acontece, e o Firestore demora a perceber a queda
addEventListener('offline', () => {
  clearTimeout(offlineTimer);
  online.set(false);
});

/** Observa a conexão real com o servidor. Retorna a função para parar. */
export function watchConnection(uid: string) {
  return onSnapshot(
    doc(db, 'users', uid),
    { includeMetadataChanges: true },
    (snap) => {
      clearTimeout(offlineTimer);
      if (!snap.metadata.fromCache) online.set(true);
      // Ao abrir, o primeiro snapshot vem do cache antes do servidor responder: espera um pouco
      else offlineTimer = setTimeout(() => online.set(false), 2500);
    },
    (err) => console.error(err),
  );
}

export const useOnline = () => useStore(online);

const pending = createStore(0);

/** Conta a gravação como pendente até o servidor confirmar (ou falhar). */
export function trackWrite(p: Promise<unknown>) {
  pending.set(pending.get() + 1);
  const done = () => pending.set(pending.get() - 1);
  p.then(done, done);
}

export const usePendingWrites = () => useStore(pending) > 0;

let checkedLastSession = false;

/** Gravações feitas offline numa sessão anterior continuam na fila; espera por elas também. */
export function trackPendingFromLastSession() {
  if (checkedLastSession) return;
  checkedLastSession = true;
  trackWrite(waitForPendingWrites(db));
}
