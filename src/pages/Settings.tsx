import { Link } from 'react-router-dom';
import { Car, ChevronRight, Info, LogOut, UserRound } from 'lucide-react';
import Header from '../components/Header';
import InstallCard from '../components/InstallCard';
import UserAvatar from '../components/UserAvatar';
import { SettingsGroup, SettingsInfo, SettingsLink } from '../components/SettingsGroup';
import { logout, useAuth } from '../auth';
import { useVehicles } from '../hooks';
import { paths } from '../routes/paths';
import { btn, card, main } from '../ui';

/** Configurações: ponto de entrada para perfil, veículos e o que vier depois. */
export default function Settings() {
  const { user } = useAuth();
  const { data: vehicles } = useVehicles(user!.uid);
  if (!user) return null;
  const name = user.displayName || user.email || 'Você';

  return (
    <>
      <Header title="Configurações" />
      <main className={`${main} flex flex-col gap-5`}>
        <Link to={paths.profile()} className={`${card} flex items-center gap-3`}>
          <UserAvatar user={user} name={name} className="size-14 text-lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-lg">{name}</strong>
            {user.email && <span className="truncate text-sm text-muted">{user.email}</span>}
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted" />
        </Link>

        <SettingsGroup title="Conta">
          <SettingsLink to={paths.profile()} icon={UserRound} label="Perfil" />
        </SettingsGroup>

        <SettingsGroup title="Garagem">
          <SettingsLink
            to={paths.vehicles()}
            icon={Car}
            label="Veículos"
            detail={vehicles.length === 1 ? '1 veículo' : `${vehicles.length} veículos`}
          />
        </SettingsGroup>

        <SettingsGroup title="Aplicativo">
          <SettingsInfo icon={Info} label="Versão" value={`v${__APP_VERSION__}`} />
        </SettingsGroup>

        <InstallCard />

        <button className={`${btn('danger')} w-full gap-2`} onClick={() => confirm('Sair da conta?') && logout()}>
          <LogOut className="size-5" />
          Sair da conta
        </button>
      </main>
    </>
  );
}
