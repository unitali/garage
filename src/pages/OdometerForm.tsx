import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import Header from '../components/Header';
import { updateOdometer } from '../db';
import { useGarage } from '../garage';
import { km, maskKm, MAX_KM_DIGITS, parseInteger } from '../lib/format';
import { paths } from '../routes/paths';
import { btn, card, error as errorText, field, form, hint, input, main, splash } from '../ui';

/** "Atualizar km": registra só a leitura do hodômetro, sem gasto. */
export default function OdometerForm() {
  const { uid, vehicle, current, loading } = useGarage();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (loading) return <div className={splash}>Carregando…</div>;
  if (!vehicle) return <div className={splash}>Veículo não encontrado.</div>;

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseInteger(value);
    if (n == null) return setError('Informe o km do painel.');
    if (n < current) return setError(`O km não pode ser menor que o atual (${km(current)}).`);
    updateOdometer(uid, vehicle!.id, n);
    navigate(paths.home(), { replace: true });
  }

  return (
    <>
      <Header title="Atualizar km" subtitle={vehicle.name} back={paths.home()} />
      <main className={main}>
        <form className={`${card} ${form}`} onSubmit={submit}>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ok-bg text-ok">
              <Gauge className="size-6" aria-hidden />
            </span>
            <p className="text-sm text-muted">Só a leitura do painel — não registra gasto. Mantém os lembretes por km em dia.</p>
          </div>
          <label className={field}>
            Km atual
            <input
              className={`${input} text-lg`}
              value={value}
              onChange={(e) => {
                setValue(maskKm(e.target.value));
                setError('');
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={MAX_KM_DIGITS}
              placeholder={String(current)}
              autoFocus
            />
            <small className={hint}>Último registrado: {km(current)}</small>
          </label>
          {error && <p className={errorText}>{error}</p>}
          <button className={`${btn('primary')} w-full`} type="submit">
            Salvar
          </button>
        </form>
      </main>
    </>
  );
}
