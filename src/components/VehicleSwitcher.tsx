import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Pencil, Plus } from 'lucide-react';
import { VEHICLE_TYPES } from '../constants';
import { km } from '../lib/format';
import { selectVehicle } from '../selection';
import type { Vehicle } from '../types';
import { avatarSmall, grow } from '../ui';
import { paths } from '../routes/paths';

const menuItem = 'flex w-full items-center gap-3 px-4 py-3 text-left active:bg-bg';

/** Pílula na barra do topo que abre a lista de veículos. Precisa de um pai com `relative` (Header `bottom`). */
export default function VehicleSwitcher({ vehicles, current, odometer }: { vehicles: Vehicle[]; current: Vehicle; odometer: number }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const icon = (v: Vehicle) => VEHICLE_TYPES[v.type]?.icon ?? '🚙';

  return (
    <>
      <button
        className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-2 text-left active:bg-white/15"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15 text-lg">{icon(current)}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate">{current.name}</strong>
          <span className="truncate text-[0.8rem] opacity-85">{[current.plate, km(odometer)].filter(Boolean).join(' · ')}</span>
        </span>
        <ChevronDown className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-xl"
          >
            <ul className="max-h-[50dvh] overflow-y-auto">
              {vehicles.map((v) => (
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
                    <span className={avatarSmall}>{icon(v)}</span>
                    <span className={grow}>
                      <strong>{v.name}</strong>
                      <span className="text-sm text-muted">
                        {[v.plate, km(v.id === current.id ? odometer : (v.odometer ?? v.initialOdometer))].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    {v.id === current.id && <Check className="size-5 shrink-0 text-brand" />}
                  </button>
                </li>
              ))}
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
    </>
  );
}
