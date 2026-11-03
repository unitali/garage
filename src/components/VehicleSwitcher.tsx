import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Pencil, Plus } from 'lucide-react';
import { km } from '../lib/format';
import { selectVehicle } from '../selection';
import type { Vehicle } from '../types';
import { grow, VEHICLE_ICON } from '../ui';
import { paths } from '../routes/paths';

const menuItem = 'flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-950';

const box = 'flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white/12 px-3 py-2 text-left';

/** Ícone, nome e placa · km do veículo (dentro da barra azul). */
function Label({ v, odometer }: { v: Vehicle; odometer: number }) {
  const Icon = VEHICLE_ICON[v.type] ?? VEHICLE_ICON.outro;
  return (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <strong className="text-lg break-words">{v.name}</strong>
        <span className="text-sm opacity-85">{[v.plate, km(odometer)].filter(Boolean).join(' · ')}</span>
      </span>
    </>
  );
}

/**
 * Veículo no cabeçalho, na largura toda: toca para abrir a lista e trocar.
 * `readOnly`: só mostra (formulários de um veículo específico — trocar ali mudaria o registro de dono).
 */
export default function VehicleSwitcher({
  vehicles,
  current,
  odometer = current.odometer ?? current.initialOdometer,
  readOnly,
}: {
  vehicles: Vehicle[];
  current: Vehicle;
  /** km atual (padrão: o salvo no veículo) */
  odometer?: number;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (readOnly)
    return (
      <div className={box}>
        <Label v={current} odometer={odometer} />
      </div>
    );

  return (
    <div className="relative">
      <button
        className={`${box} active:bg-white/20`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Veículo: ${current.name}. Trocar de veículo`}
        onClick={() => setOpen(!open)}
      >
        <Label v={current} odometer={odometer} />
        <ChevronDown className={`size-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl"
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
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {[v.plate, km(v.id === current.id ? odometer : (v.odometer ?? v.initialOdometer))].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {v.id === current.id && <Check className="size-5 shrink-0 text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-slate-200 dark:border-slate-800">
              <button role="menuitem" className={`${menuItem} font-semibold`} onClick={() => navigate(paths.editVehicle(current.id))}>
                <Pencil className="size-5 text-slate-600 dark:text-slate-400" />
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
