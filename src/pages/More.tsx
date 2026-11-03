import { Calculator, Car, LogOut, Settings } from 'lucide-react';
import Header from '../components/Header';
import { SettingsGroup, SettingsLink } from '../components/SettingsGroup';
import { logout } from '../auth';
import { paths } from '../routes/paths';
import { btn, main } from '../ui';

/** Mais: atalhos que não cabem na barra de baixo. */
export default function More() {
  return (
    <>
      <Header title="Mais" />
      <main className={`${main} flex flex-col gap-5`}>
        <SettingsGroup title="Ferramentas">
          <SettingsLink to={paths.calculator()} icon={Calculator} label="Calcular (etanol ou gasolina)" />
        </SettingsGroup>
        <SettingsGroup title="Conta e garagem">
          <SettingsLink to={paths.settings()} icon={Settings} label="Configurações" />
          <SettingsLink to={paths.vehicles()} icon={Car} label="Veículos" />
        </SettingsGroup>
        <button className={`${btn('danger')} w-full gap-2`} onClick={() => confirm('Sair da conta?') && logout()}>
          <LogOut className="size-5" aria-hidden />
          Sair
        </button>
        <p className="text-center text-xs text-muted">Unitali Garage v{__APP_VERSION__}</p>
      </main>
    </>
  );
}
