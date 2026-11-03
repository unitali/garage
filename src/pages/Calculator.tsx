import Header from '../components/Header';
import FuelCalculator from '../components/FuelCalculator';
import { paths } from '../routes/paths';
import { useUid } from '../auth';
import { useEntries, useVehicles } from '../hooks';
import { useSelectedVehicle } from '../selection';
import { main, splash } from '../ui';

/** Calculadora: compensa abastecer com etanol ou gasolina? Não grava nada. */
export default function Calculator() {
  const uid = useUid();
  const { data: vehicles } = useVehicles(uid);
  const vehicle = useSelectedVehicle(vehicles);
  const { data: entries, loading } = useEntries(uid, vehicle?.id);

  return (
    <>
      <Header title="Calculadora" back={paths.more()} />
      <main className={main}>
        {/* espera os registros: a calculadora começa com os últimos preços (key: troca de veículo recomeça) */}
        {loading ? <div className={splash}>Carregando…</div> : <FuelCalculator key={vehicle?.id} entries={entries} />}
      </main>
    </>
  );
}
