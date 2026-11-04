import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { clearIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, terminate } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cache persistente (IndexedDB): o app abre e funciona offline, e sincroniza quando a rede volta.
// Ele guarda os dados de quem está logado — ao sair, clearLocalData() apaga tudo (auth.tsx).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

/**
 * Apaga o cache do Firestore deste aparelho (para quem pegar o aparelho depois do "Sair" não ler nada
 * offline). O Firestore fica encerrado: em seguida a página precisa recarregar.
 */
export async function clearLocalData() {
  await terminate(db);
  try {
    await clearIndexedDbPersistence(db);
  } catch {
    // outra aba ainda usa o cache: o pedido de exclusão fica na fila e o navegador apaga quando ela fechar
    const dbs = (await indexedDB.databases?.()) ?? [];
    for (const { name } of dbs) if (name?.startsWith('firestore/')) indexedDB.deleteDatabase(name);
  }
}
