import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, loading: false })), []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Só usar dentro das telas autenticadas. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

const REDIRECT_FALLBACK = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];

export async function login() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (REDIRECT_FALLBACK.includes(code)) return signInWithRedirect(auth, googleProvider);
    throw e;
  }
}

export const logout = () => signOut(auth);
