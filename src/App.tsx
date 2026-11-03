import { useEffect, type ReactNode } from 'react';
import { matchRoutes, useLocation, useRoutes } from 'react-router-dom';
import { useAuth } from './auth';
import { watchConnection } from './sync';
import { splash } from './ui';
import { routes, type RouteHandle } from './routes';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';

/** Coluna do app: ocupa a tela toda no celular e para no tamanho de um tablet (768px). */
function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh max-w-3xl bg-slate-100 dark:bg-slate-950 md:border-x md:border-slate-200 dark:md:border-slate-800">{children}</div>;
}

export default function App() {
  const { user, loading } = useAuth();
  const uid = user?.uid;
  const location = useLocation();
  const page = useRoutes(routes);

  useEffect(() => (uid ? watchConnection(uid) : undefined), [uid]);

  const matches = matchRoutes(routes, location);
  const showNav = !!(matches?.[matches.length - 1]?.route.handle as RouteHandle | undefined)?.bottomNav;

  if (loading)
    return (
      <Shell>
        <div className={splash}>Carregando…</div>
      </Shell>
    );
  if (!user)
    return (
      <Shell>
        <Login />
      </Shell>
    );

  return (
    <Shell>
      {/* espaço da barra de baixo (64px) + área segura: nada fica escondido atrás dela */}
      <div className={showNav ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}>{page}</div>
      {showNav && <BottomNav />}
    </Shell>
  );
}
