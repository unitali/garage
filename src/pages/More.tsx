import { Link } from 'react-router-dom';
import { Car, ChevronRight, LogOut } from 'lucide-react';
import DeleteAccount from '../components/DeleteAccount';
import Header from '../components/Header';
import InstallCard from '../components/InstallCard';
import UserAvatar from '../components/UserAvatar';
import { SettingsAction, SettingsGroup, SettingsLink } from '../components/SettingsGroup';
import { logout, useAuth } from '../auth';
import { paths } from '../routes/paths';
import { card, KIND_ICON, main, REMINDER_ICON } from '../ui';
import { ask } from '../dialog';

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
            {user.email && <span className="text-sm break-all text-slate-600 dark:text-slate-400">{user.email}</span>}
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-600 dark:text-slate-400" />
        </Link>

        {/* tudo num menu só, cada item com o nome da tela que abre */}
        <SettingsGroup>
          <SettingsLink to={paths.vehicles()} icon={Car} label="Veículos" />
          <SettingsLink to={paths.reminderSettings()} icon={REMINDER_ICON} label="Lembretes" />
          <SettingsLink to={paths.categories('service')} icon={KIND_ICON.service} label="Serviços" />
          <SettingsLink to={paths.categories('expense')} icon={KIND_ICON.expense} label="Despesas" />
          <SettingsAction
            icon={LogOut}
            label="Sair"
            danger
            onClick={async () => {
              const ok = await ask({
                title: 'Sair da conta?',
                message: 'Seus dados continuam salvos. Para voltar, é só entrar com o Google de novo.',
                confirmLabel: 'Sair',
                tone: 'primary',
                icon: LogOut,
              });
              if (ok) logout();
            }}
          />
        </SettingsGroup>

        <InstallCard />

        <DeleteAccount />

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">Unitali Garage v{__APP_VERSION__}</p>
      </main>
    </>
  );
}
