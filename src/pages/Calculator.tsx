import { useEffect, useMemo, useState } from 'react';
import { Fuel } from 'lucide-react';
import Header from '../components/Header';
import { useUid } from '../auth';
import { useEntries, useVehicles } from '../hooks';
import { ETHANOL_THRESHOLD, fuelChoice } from '../lib/calc';
import { brl, maskMoney, num, parseDecimal, toInput } from '../lib/format';
import { useSelectedVehicle } from '../selection';
import type { Entry } from '../types';
import { card, checkbox, checkField, field, grid2, hint, input, main, sectionTitle } from '../ui';

/** Último preço por litro registrado para o combustível (abastecimentos do veículo selecionado). */
function lastPrice(entries: Entry[], fuelType: string): string {
  const last = entries
    .filter((e) => e.kind === 'fuel' && e.fuelType === fuelType && e.pricePerLiter)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return last ? toInput(last.pricePerLiter, 2) : '';
}

/** Calculadora: compensa abastecer com etanol ou gasolina? Não grava nada. */
export default function Calculator() {
  const uid = useUid();
  const { data: vehicles } = useVehicles(uid);
  const vehicle = useSelectedVehicle(vehicles);
  const { data: entries, loading } = useEntries(uid, vehicle?.id);

  const [ethanol, setEthanol] = useState('');
  const [gas, setGas] = useState('');
  const [useCar, setUseCar] = useState(false);
  const [kmlEthanol, setKmlEthanol] = useState('');
  const [kmlGas, setKmlGas] = useState('');

  // preenche com os últimos preços registrados (só se a pessoa ainda não digitou)
  useEffect(() => {
    if (loading) return;
    setEthanol((v) => v || lastPrice(entries, 'Etanol'));
    setGas((v) => v || lastPrice(entries, 'Gasolina'));
  }, [loading, entries]);

  const pe = parseDecimal(ethanol);
  const pg = parseDecimal(gas);
  const ke = useCar ? parseDecimal(kmlEthanol) : null;
  const kg = useCar ? parseDecimal(kmlGas) : null;
  const result = useMemo(() => (pe && pg ? fuelChoice(pe, pg, ke, kg) : null), [pe, pg, ke, kg]);
  const pct = (n: number) => `${num(n * 100, 1)}%`;

  return (
    <>
      <Header title="Calculadora" />
      <main className={`${main} flex flex-col gap-4`}>
        <section className={`${card} flex flex-col gap-3.5`}>
          <h2 className={sectionTitle}>Etanol ou gasolina?</h2>
          <div className={grid2}>
            <label className={field}>
              Etanol (R$/L)
              <input className={input} value={ethanol} onChange={(e) => setEthanol(maskMoney(e.target.value))} inputMode="numeric" placeholder="0,00" />
            </label>
            <label className={field}>
              Gasolina (R$/L)
              <input className={input} value={gas} onChange={(e) => setGas(maskMoney(e.target.value))} inputMode="numeric" placeholder="0,00" />
            </label>
          </div>

          <label className={checkField}>
            <input className={checkbox} type="checkbox" checked={useCar} onChange={(e) => setUseCar(e.target.checked)} />
            <span>
              Usar o consumo do meu carro
              <small className={hint}> — mais preciso que a regra dos 70%</small>
            </span>
          </label>
          {useCar && (
            <div className={grid2}>
              <label className={field}>
                Com etanol (km/l)
                <input className={input} value={kmlEthanol} onChange={(e) => setKmlEthanol(maskMoney(e.target.value))} inputMode="numeric" placeholder="0,00" />
              </label>
              <label className={field}>
                Com gasolina (km/l)
                <input className={input} value={kmlGas} onChange={(e) => setKmlGas(maskMoney(e.target.value))} inputMode="numeric" placeholder="0,00" />
              </label>
            </div>
          )}
        </section>

        {result ? (
          <section
            className={`${card} flex flex-col items-center gap-2 border-l-4 py-6 text-center ${
              result.best === 'etanol' ? 'border-l-ok' : 'border-l-brand'
            }`}
            aria-live="polite"
          >
            <span className={`grid size-14 place-items-center rounded-full ${result.best === 'etanol' ? 'bg-ok/15 text-ok' : 'bg-brand-soft text-brand'}`}>
              <Fuel className="size-7" />
            </span>
            <span className="text-sm text-muted">Compensa abastecer com</span>
            <strong className={`text-3xl uppercase ${result.best === 'etanol' ? 'text-ok' : 'text-brand'}`}>{result.best}</strong>
            <p className="text-sm">
              O etanol custa <b>{pct(result.ratio)}</b> do preço da gasolina — {result.best === 'etanol' ? 'abaixo' : 'acima'} do limite de{' '}
              <b>{pct(result.threshold)}</b>
              {result.threshold === ETHANOL_THRESHOLD ? ' (regra dos 70%)' : ' (rendimento do seu carro)'}.
            </p>
            {result.perKm && (
              <dl className="mt-2 grid w-full grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-bg p-2.5">
                  <dt className="text-muted">Etanol</dt>
                  <dd className="font-bold">{brl(result.perKm.etanol)}/km</dd>
                </div>
                <div className="rounded-xl bg-bg p-2.5">
                  <dt className="text-muted">Gasolina</dt>
                  <dd className="font-bold">{brl(result.perKm.gasolina)}/km</dd>
                </div>
              </dl>
            )}
          </section>
        ) : (
          <p className="text-center text-sm text-muted">Informe o preço do etanol e da gasolina.</p>
        )}

        {!useCar && (
          <p className="text-xs text-muted">
            Regra dos 70%: o etanol rende cerca de 30% menos por litro, então só compensa se custar até 70% da gasolina. Cada
            carro é diferente — marque "Usar o consumo do meu carro" para o cálculo exato.
          </p>
        )}
      </main>
    </>
  );
}
