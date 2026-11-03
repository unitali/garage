import { Link } from 'react-router-dom';
import { Car, ChevronRight, LogOut } from 'lucide-react';
import Header from '../components/Header';
import InstallCard from '../components/InstallCard';
import UserAvatar from '../components/UserAvatar';
import { SettingsAction, SettingsGroup, SettingsLink } from '../components/SettingsGroup';
import { logout, useAuth } from '../auth';
import { paths } from '../routes/paths';
import { card, KIND_ICON, main, REMINDER_ICON } from '../ui';

/** Mais: perfil e um menu só com as configurações (Veículos, Lembretes, Serviços, Despesas) e Sair. */
export default function More() {
  const { user } = useAuth();
  if (!user) return null;
  const name = user.displayName || user.email || 'Você';

  return (
    <>
      <Header title="Mais" />
      <main className={`${main} flex flex-col gap-5`}>
        <Link to={paths.profile()} className={`${card} flex items-center gap-3`}>
          <UserAvatar user={user} name={name} className="size-14 text-lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-lg break-words">{name}</strong>
            {user.email && <span className="text-sm break-all text-muted">{user.email}</span>}
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted" />
        </Link>

        {/* tudo num menu só, cada item com o nome da tela que abre */}
        <SettingsGroup>
          <SettingsLink to={paths.vehicles()} icon={Car} label="Veículos" />
          <SettingsLink to={paths.reminderSettings()} icon={REMINDER_ICON} label="Lembretes" />
          <SettingsLink to={paths.categories('service')} icon={KIND_ICON.service} label="Serviços" />
          <SettingsLink to={paths.categories('expense')} icon={KIND_ICON.expense} label="Despesas" />
          <SettingsAction icon={LogOut} label="Sair" danger onClick={() => confirm('Sair da conta?') && logout()} />
        </SettingsGroup>

        <InstallCard />

        <p className="text-center text-xs text-muted">Unitali Garage v{__APP_VERSION__}</p>
      </main>
    </>
  );
}
