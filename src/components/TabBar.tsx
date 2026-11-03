import type { ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, CircleUserRound, Fuel, House, Wrench } from 'lucide-react';
import { useUid } from '../auth';
import { useVehicles } from '../hooks';
import { useSelectedVehicle } from '../selection';
import { paths } from '../routes/paths';

/** Barra fixa de atalhos, como num app: Início, Serviço, Abastecer, Lembretes e Perfil. */
export default function TabBar() {
  const uid = useUid();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { data: vehicles } = useVehicles(uid);
  const selected = useSelectedVehicle(vehicles);

  // Atalhos agem sobre o veículo selecionado no topo da tela inicial; sem nenhum, cadastrar o primeiro
  function go(target: (vid: string) => string) {
    navigate(selected ? target(selected.id) : paths.newVehicle());
  }

  const onHome = pathname === paths.home();
  const onReminders = onHome && params.get('tab') === 'lembretes';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:border-x">
      <div className="grid h-16 grid-cols-5">
        <Tab icon={<House />} label="Início" active={onHome && !onReminders} onClick={() => navigate(paths.home())} />
        <Tab icon={<Wrench />} label="Serviço" onClick={() => go((vid) => paths.newEntry(vid, 'service'))} />
        <button
          className="flex flex-col items-center justify-end gap-0.5 pb-2 text-[11px] font-semibold text-brand"
          onClick={() => go((vid) => paths.newEntry(vid, 'fuel'))}
        >
          {/* ação mais usada: botão redondo saltando da barra */}
          <span className="-mt-7 mb-0.5 grid size-14 place-items-center rounded-full bg-brand text-brand-contrast shadow-lg ring-4 ring-bg">
            <Fuel className="size-6" />
          </span>
          Abastecer
        </button>
        <Tab icon={<Bell />} label="Lembretes" active={onReminders} onClick={() => go(() => paths.home('lembretes'))} />
        <Tab icon={<CircleUserRound />} label="Perfil" active={pathname === paths.profile()} onClick={() => navigate(paths.profile())} />
      </div>
    </nav>
  );
}

function Tab({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold [&_svg]:size-6 ${
        active ? 'text-brand' : 'text-muted'
      }`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
