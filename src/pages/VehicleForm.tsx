import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useUid } from '../auth';
import { useVehicle } from '../hooks';
import { deleteVehicle, saveVehicle } from '../db';
import { VEHICLE_TYPES } from '../constants';
import { MAX_KM_DIGITS, maskKm, parseInteger } from '../lib/format';
import { selectVehicle } from '../selection';
import type { Vehicle, VehicleType } from '../types';
import { btn, error as errorText, field, form, hint, input, main, opt, splash } from '../ui';
import { paths } from '../routes/paths';

export default function VehicleFormPage() {
  const { vid } = useParams();
  const uid = useUid();
  const { data, loading } = useVehicle(uid, vid);

  if (vid && loading) return <div className={splash}>Carregando…</div>;
  return <VehicleForm uid={uid} vid={vid} initial={data} />;
}

function VehicleForm({ uid, vid, initial }: { uid: string; vid?: string; initial: Vehicle | null }) {
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'carro');
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [odo, setOdo] = useState(initial ? String(initial.initialOdometer) : '');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const initialOdometer = parseInteger(odo);
    if (!name.trim()) return setError('Dê um nome ao veículo.');
    if (initialOdometer == null) return setError('Informe a quilometragem atual.');

    const id = saveVehicle(uid, vid, {
      name: name.trim(),
      type,
      plate: plate.trim().toUpperCase(),
      initialOdometer,
      odometer: Math.max(initial?.odometer ?? 0, initialOdometer),
      createdAt: initial?.createdAt ?? Date.now(),
    });
    // veículo novo vira o selecionado e volta para a tela inicial; edição volta de onde veio
    if (vid) return navigate(-1);
    selectVehicle(id);
    navigate(paths.home(), { replace: true });
  }

  async function remove() {
    if (!vid || !confirm(`Excluir "${initial?.name}" e todo o histórico dele? Não dá para desfazer.`)) return;
    await deleteVehicle(uid, vid);
    navigate(paths.home(), { replace: true });
  }

  return (
    <>
      <Header title={vid ? 'Editar veículo' : 'Novo veículo'} back={vid ? paths.vehicle(vid) : paths.home()} />
      <main className={main}>
        <form className={form} onSubmit={submit}>
          <label className={field}>
            Nome
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Palio 2011" autoFocus={!vid} />
          </label>

          <label className={field}>
            Tipo
            <select className={input} value={type} onChange={(e) => setType(e.target.value as VehicleType)}>
              {Object.entries(VEHICLE_TYPES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className={field}>
            Placa <span className={opt}>(opcional)</span>
            <input className={input} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC1D23" autoCapitalize="characters" />
          </label>

          <label className={field}>
            {vid ? 'Quilometragem no cadastro' : 'Quilometragem atual'}
            <input className={input} value={odo} onChange={(e) => setOdo(maskKm(e.target.value))} inputMode="numeric" pattern="[0-9]*" maxLength={MAX_KM_DIGITS} placeholder="Ex: 125000" />
            <small className={hint}>Ponto de partida para calcular km rodados e custo por km.</small>
          </label>

          {error && <p className={errorText}>{error}</p>}
          <button className={`${btn('primary')} w-full`} type="submit">
            Salvar
          </button>
          {vid && (
            <button type="button" className={`${btn('danger')} w-full`} onClick={remove}>
              Excluir veículo
            </button>
          )}
        </form>
      </main>
    </>
  );
}
