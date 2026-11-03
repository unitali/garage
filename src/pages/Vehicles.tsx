import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import Header from '../components/Header';
import { useUid } from '../auth';
import { useVehicles } from '../hooks';
import { VEHICLE_TYPES } from '../constants';
import { km } from '../lib/format';
import { paths } from '../routes/paths';
import { useSelectedVehicle } from '../selection';
import { btn, cardRow, emptyText, grow, list, main } from '../ui';

/** Configurações → Veículos: editar ou adicionar. */
export default function Vehicles() {
  const uid = useUid();
  const { data: vehicles, loading } = useVehicles(uid);
  const selected = useSelectedVehicle(vehicles);

  return (
    <>
      <Header title="Veículos" back={paths.settings()} />
      <main className={main}>
        {loading ? (
          <p className={emptyText}>Carregando…</p>
        ) : vehicles.length === 0 ? (
          <p className={emptyText}>Nenhum veículo cadastrado.</p>
        ) : (
          <ul className={list}>
            {vehicles.map((v) => (
              <li key={v.id}>
                <Link className={cardRow} to={paths.editVehicle(v.id)}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-[1.4rem]">
                    {VEHICLE_TYPES[v.type]?.icon ?? '🚙'}
                  </span>
                  <span className={grow}>
                    <strong className="flex items-center gap-2">
                      <span className="truncate">{v.name}</span>
                      {v.id === selected?.id && (
                        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">na tela inicial</span>
                      )}
                    </strong>
                    <span className="text-sm text-muted">
                      {[VEHICLE_TYPES[v.type]?.label, v.plate, km(v.odometer ?? v.initialOdometer)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className={`${btn('primary')} w-full gap-2`} to={paths.newVehicle()}>
          <Plus className="size-5" />
          Adicionar veículo
        </Link>
      </main>
    </>
  );
}
