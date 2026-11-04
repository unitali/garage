import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { waitForPendingWrites } from 'firebase/firestore';
import { auth, clearLocalData, db, googleProvider } from './firebase';
import { ask, UserFacingError } from './dialog';
import { stopLive } from './hooks';
import { isStandalone } from './pwa';
import { clearSelectedVehicle } from './selection';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

// ---------- dados do aparelho pertencem a quem está logado ----------

/** uid dono do cache local deste aparelho (só o id; os dados ficam no IndexedDB do Firestore) */
const OWNER_KEY = 'cache-owner';
const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      // sem storage: nada a guardar
    }
  },
};

/**
 * Saiu (pelo app, por exclusão da conta ou sessão encerrada) ou entrou outra conta: apaga o cache do
 * Firestore e o veículo escolhido, e recarrega — ninguém lê offline os dados de quem saiu.
 */
async function wipeDevice() {
  stopLive();
  clearSelectedVehicle();
  await clearLocalData().catch(console.error);
  storage.set(OWNER_KEY, null);
  location.reload();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => {
    let uid: string | undefined;
    return onAuthStateChanged(auth, (user) => {
      const owner = storage.get(OWNER_KEY);
      if (owner && owner !== user?.uid) {
        void wipeDevice(); // continua "carregando" até recarregar
        return;
      }
      if (user) storage.set(OWNER_KEY, user.uid);
      // dados em memória são do usuário logado: ao sair ou trocar de conta, fecha as assinaturas
      if (user?.uid !== uid) stopLive();
      uid = user?.uid;
      setState({ user, loading: false });
    });
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Só usar dentro das telas autenticadas. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

// ---------- entrar e sair ----------

const REDIRECT_FALLBACK = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];

// handler do login no próprio domínio (proxy /__/auth do vercel.json): o redirecionamento não depende de cookie de terceiros
const sameOriginAuth = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN === location.host;
// No app instalado o popup costuma travar (iOS abre numa janela à parte que não volta);
// com o handler no mesmo domínio, o redirecionamento é o caminho confiável
const useRedirect = isStandalone && sameOriginAuth;

export async function login() {
  if (useRedirect) return signInWithRedirect(auth, googleProvider);
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (REDIRECT_FALLBACK.includes(code)) return signInWithRedirect(auth, googleProvider);
    throw e;
  }
}

/** Sai da conta (o cache do aparelho é apagado em seguida, pelo AuthProvider). */
export async function logout() {
  // sem internet, alterações ainda não enviadas se perderiam junto com o cache
  const synced = await Promise.race([
    waitForPendingWrites(db).then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
  ]);
  if (
    !synced &&
    !(await ask({
      title: 'Sair sem enviar as alterações?',
      message: 'Algumas alterações ainda não foram enviadas (sem internet). Se sair agora, elas serão perdidas.',
      confirmLabel: 'Sair mesmo assim',
    }))
  )
    return;
  await signOut(auth);
}

// ---------- confirmar a conta antes de excluir em massa ----------

/** login de até 5 minutos atrás vale como confirmação (é o mesmo prazo que o Firebase exige para excluir a conta) */
const RECENT_MS = 5 * 60_000;
let confirmedAt = 0;
const recentlyConfirmed = (user: User) =>
  Date.now() - Math.max(Date.parse(user.metadata.lastSignInTime ?? '') || 0, confirmedAt) < RECENT_MS;

const REAUTH_ERRORS: Record<string, string> = {
  'auth/popup-closed-by-user': 'Confirmação cancelada. Para continuar, confirme sua conta Google.',
  'auth/cancelled-popup-request': 'Confirmação cancelada. Para continuar, confirme sua conta Google.',
  'auth/user-mismatch': 'Escolha a mesma conta Google que você usa no app.',
  'auth/network-request-failed': 'Sem internet. Verifique a conexão e tente de novo.',
};

/** O que fazer ao voltar da confirmação por redirecionamento (app instalado), guardado nesta aba. */
const INTENT_KEY = 'reauth-intent';
const readIntent = (): { intent: string; at: number } | null => {
  try {
    return JSON.parse(sessionStorage.getItem(INTENT_KEY) ?? 'null');
  } catch {
    return null;
  }
};
const writeIntent = (v: { intent: string; at: number } | null) => {
  try {
    if (v) sessionStorage.setItem(INTENT_KEY, JSON.stringify(v));
    else sessionStorage.removeItem(INTENT_KEY);
  } catch {
    // sem storage: depois de voltar, basta tocar de novo
  }
};

/**
 * Pede a conta Google de novo antes de apagar muita coisa (veículo, conta), a menos que o login seja
 * recente. No app instalado vai por redirecionamento: a página sai e, ao voltar, useResumeAfterReauth
 * reabre a confirmação de `intent`.
 */
export async function confirmIdentity(intent: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new UserFacingError('Sua sessão terminou. Entre de novo.');
  if (recentlyConfirmed(user)) return;
  const redirect = () => {
    writeIntent({ intent, at: Date.now() });
    return reauthenticateWithRedirect(user, googleProvider).then(() => new Promise<never>(() => {})); // a página sai daqui
  };
  if (useRedirect) return redirect();
  try {
    await reauthenticateWithPopup(user, googleProvider);
    confirmedAt = Date.now();
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (REDIRECT_FALLBACK.includes(code)) return redirect();
    throw new UserFacingError(REAUTH_ERRORS[code] ?? 'Não foi possível confirmar sua conta. Tente de novo.');
  }
}

/** Ao voltar da confirmação por redirecionamento, roda `resume` (que reabre a confirmação de `intent`). */
export function useResumeAfterReauth(intent: string | null, resume: () => void) {
  useEffect(() => {
    const saved = readIntent();
    if (!intent || saved?.intent !== intent) return;
    writeIntent(null);
    if (Date.now() - saved.at > 10 * 60_000) return;
    getRedirectResult(auth)
      .then((result) => {
        if (!result) return;
        confirmedAt = Date.now();
        resume();
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);
}
