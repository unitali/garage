import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Pencil, Plus } from 'lucide-react';
import { km } from '../lib/format';
import { selectVehicle } from '../selection';
import type { Vehicle } from '../types';
import { grow, VEHICLE_ICON } from '../ui';
import { paths } from '../routes/paths';

const menuItem = 'flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left active:bg-bg';

/**
 * Pílula com o veículo selecionado (nome + placa + chevron) que abre a lista de veículos.
 * `header`: na barra azul da tela inicial; `compact`: no canto do cabeçalho (Histórico, Lembretes).
 */
export default function VehicleSwitcher({
  vehicles,
  current,
  odometer,
  variant = 'header',
}: {
  vehicles: Vehicle[];
  current: Vehicle;
  odometer: number;
  variant?: 'header' | 'compact';
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-w-0">
      <button
        className="flex min-h-11 max-w-full items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-left active:bg-white/20"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Veículo: ${current.name}. Trocar de veículo`}
        onClick={() => setOpen(!open)}
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <strong className="break-words">{current.name}</strong>
          {variant === 'header' && current.plate && <span className="text-xs opacity-85">{current.plate}</span>}
        </span>
        <ChevronDown className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={`absolute top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-xl ${
              variant === 'compact' ? 'right-0' : 'left-0'
            }`}
          >
            <ul className="max-h-[50dvh] overflow-y-auto">
              {vehicles.map((v) => {
                const Icon = VEHICLE_ICON[v.type] ?? VEHICLE_ICON.outro;
                return (
                  <li key={v.id}>
                    <button
                      role="menuitemradio"
                      aria-checked={v.id === current.id}
                      className={menuItem}
                      onClick={() => {
                        selectVehicle(v.id);
                        setOpen(false);
                      }}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon className="size-5" />
                      </span>
                      <span className={grow}>
                        <strong className="break-words">{v.name}</strong>
                        <span className="text-sm text-muted">
                          {[v.plate, km(v.id === current.id ? odometer : (v.odometer ?? v.initialOdometer))].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {v.id === current.id && <Check className="size-5 shrink-0 text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line">
              <button role="menuitem" className={`${menuItem} font-semibold`} onClick={() => navigate(paths.editVehicle(current.id))}>
                <Pencil className="size-5 text-muted" />
                Editar {current.name}
              </button>
              <button role="menuitem" className={`${menuItem} font-semibold text-brand`} onClick={() => navigate(paths.newVehicle())}>
                <Plus className="size-5" />
                Adicionar veículo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
