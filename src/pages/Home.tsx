import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Car, Plus } from 'lucide-react';
import Header from '../components/Header';
import InstallCard from '../components/InstallCard';
import VehicleSwitcher from '../components/VehicleSwitcher';
import { Expenses, History, Reminders, Summary } from './VehicleTabs';
import { useUid } from '../auth';
import { syncVehicleOdometer } from '../db';
import { useAlertWindow, useEntries, useReminders, useVehicles } from '../hooks';
import { currentOdometer, kmPerDay, remindersByDue } from '../lib/calc';
import { paths, type VehicleTab } from '../routes/paths';
import { useSelectedVehicle } from '../selection';
import type { Vehicle } from '../types';
import { btn, emptyText, fab, main, mainWithFab, splash } from '../ui';

const TABS: { id: VehicleTab; label: string }[] = [
  { id: 'historico', label: 'Histórico' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'lembretes', label: 'Lembretes' },
];
const DEFAULT_TAB: VehicleTab = 'historico';

export default function Home() {
  const uid = useUid();
  const { data: vehicles, loading } = useVehicles(uid);
  const vehicle = useSelectedVehicle(vehicles);

  if (loading) return <div className={splash}>Carregando…</div>;
  if (!vehicle) return <NoVehicle />;
  return <VehicleHome key={vehicle.id} uid={uid} v={vehicle} vehicles={vehicles} />;
}

function NoVehicle() {
  return (
    <>
      <Header title="Unitali Garage" logo />
      <main className={`${main} flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-center`}>
        <span className="grid size-20 place-items-center rounded-full bg-brand-soft text-brand">
          <Car className="size-10" />
        </span>
        <h2 className="text-xl font-bold">Nenhum veículo ainda</h2>
        <p className="max-w-xs text-muted">Cadastre seu carro, moto ou bike para acompanhar abastecimentos, serviços e lembretes.</p>
        <Link className={`${btn('primary')} mt-2 gap-2`} to={paths.newVehicle()}>
          <Plus className="size-5" />
          Cadastrar veículo
        </Link>
        <InstallCard className="mt-8 w-full text-left" />
      </main>
    </>
  );
}

/** Veículo selecionado, com as abas. Abre sempre no Histórico. */
function VehicleHome({ uid, v, vehicles }: { uid: string; v: Vehicle; vehicles: Vehicle[] }) {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as VehicleTab | null;
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam! : DEFAULT_TAB;

  const entries = useEntries(uid, v.id);
  const reminders = useReminders(uid, v.id);

  const current = useMemo(() => currentOdometer(v, entries.data), [v, entries.data]);
  const rate = useMemo(() => kmPerDay(v, entries.data), [v, entries.data]);
  const alert = useAlertWindow(uid);
  const due = useMemo(
    () => remindersByDue(reminders.data, current, rate, undefined, alert),
    [reminders.data, current, rate, alert.km, alert.months], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // mantém o km do veículo em dia (inclusive após editar/excluir registros)
  useEffect(() => {
    if (!entries.loading && v.odometer !== current) syncVehicleOdometer(uid, v.id, current);
  }, [v, uid, current, entries.loading]);

  const loading = entries.loading || reminders.loading;
  // botão + só onde faz sentido: despesas e lembretes (abastecer/serviço ficam na barra de baixo)
  const add =
    tab === 'despesas'
      ? { to: paths.newEntry(v.id, 'expense'), label: 'Nova despesa' }
      : tab === 'lembretes'
        ? { to: paths.newReminder(v.id), label: 'Novo lembrete' }
        : null;

  return (
    <>
      <Header logo title="Unitali Garage" scrollAway bottom={<VehicleSwitcher vehicles={vehicles} current={v} odometer={current} />}>
        <nav className="flex border-b border-line bg-surface">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`flex-1 border-b-[3px] px-1 py-3 text-sm font-semibold ${
                tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted'
              }`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setParams(t.id === DEFAULT_TAB ? {} : { tab: t.id }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </Header>
      <main className={add ? mainWithFab : main}>
        {loading ? (
          <p className={emptyText}>Carregando…</p>
        ) : (
          <>
            {tab === 'historico' && <History v={v} entries={entries.data} due={due} />}
            {tab === 'resumo' && <Summary v={v} entries={entries.data} due={due} current={current} />}
            {tab === 'despesas' && <Expenses v={v} entries={entries.data} />}
            {tab === 'lembretes' && <Reminders uid={uid} v={v} due={due} current={current} />}
            {tab === 'historico' && <InstallCard className="mt-4" />}
          </>
        )}
      </main>
      {add && (
        <Link className={fab} to={add.to} aria-label={add.label}>
          <Plus className="size-7" />
        </Link>
      )}
    </>
  );
}
