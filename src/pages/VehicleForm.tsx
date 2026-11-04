import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Select from '../components/Select';
import { confirmIdentity, useResumeAfterReauth, useUid } from '../auth';
import { useVehicle } from '../hooks';
import { deleteVehicle, saveVehicle } from '../db';
import { VEHICLE_TYPES } from '../constants';
import { MAX_KM_DIGITS, maskKm, parseInteger } from '../lib/format';
import { maskPlate, plateFormat, plateHint, plateMaxLength } from '../lib/plates';
import { selectVehicle } from '../selection';
import type { Vehicle, VehicleType } from '../types';
import { btn, error as errorText, field, form, hint, input, main, opt, splash, VEHICLE_ICON } from '../ui';
import { paths } from '../routes/paths';
import { ask } from '../dialog';

const TYPE_OPTIONS = (Object.keys(VEHICLE_TYPES) as VehicleType[]).map((value) => ({
  value,
  label: VEHICLE_TYPES[value].label,
  icon: VEHICLE_ICON[value],
}));

export default function VehicleFormPage() {
  const { vid } = useParams();
  const uid = useUid();
  const { data, loading } = useVehicle(uid, vid);

  if (vid && loading) return <div className={splash}>Carregando…</div>;
  // id que não é um veículo seu: não vira cadastro novo com esse id
  if (vid && !data) return <div className={splash}>Veículo não encontrado.</div>;
  return <VehicleForm uid={uid} vid={vid} initial={data} />;
}

function VehicleForm({ uid, vid, initial }: { uid: string; vid?: string; initial: Vehicle | null }) {
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'carro');
  const [plate, setPlate] = useState(maskPlate(initial?.plate ?? ''));
  const format = plateFormat(plate);
  const [odo, setOdo] = useState(initial ? String(initial.initialOdometer) : '');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const initialOdometer = parseInteger(odo);
    if (!name.trim()) return setError('Dê um nome ao veículo.');
    if (initialOdometer == null) return setError('Informe a quilometragem atual.');
    // placa é opcional; preenchida (e mudada), precisa estar completa num dos formatos
    if (plate && plate !== initial?.plate && !format) return setError(`Placa incompleta ou inválida. Use ${plateHint()}.`);

    const id = saveVehicle(
      uid,
      vid,
      {
        name: name.trim(),
        type,
        plate,
        initialOdometer,
        odometer: Math.max(initial?.odometer ?? 0, initialOdometer),
        createdAt: initial?.createdAt ?? Date.now(),
      },
      initial,
    );
    // veículo novo vira o selecionado e volta para a tela inicial; edição volta de onde veio
    if (vid) return navigate(-1);
    selectVehicle(id);
    navigate(paths.home(), { replace: true });
  }

  const removeIntent = vid ? `delete-vehicle:${vid}` : null;
  useResumeAfterReauth(removeIntent, remove);

  async function remove() {
    if (!vid || !removeIntent) return;
    const ok = await ask({
      title: `Excluir "${initial?.name}"?`,
      message: 'O veículo e todo o histórico dele (abastecimentos, serviços, despesas e lembretes) serão excluídos. Não dá para desfazer.',
      confirmLabel: 'Excluir veículo',
      // apaga muita coisa: pede a conta Google de novo (se o login não for recente) e exclui no servidor —
      // o pop-up espera e, sem internet, avisa sem fechar
      action: async () => {
        await confirmIdentity(removeIntent);
        await deleteVehicle(uid, vid);
      },
      errorText: 'Não foi possível excluir agora. Verifique a internet e tente de novo.',
    });
    if (ok) navigate(paths.home(), { replace: true });
  }

  return (
    <>
      <Header title={vid ? 'Editar veículo' : 'Novo veículo'} vehicle={false} back={vid ? paths.vehicle(vid) : paths.home()} />
      <main className={main}>
        <form className={form} onSubmit={submit}>
          <label className={field}>
            Nome
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Palio 2011" maxLength={60} autoFocus={!vid} />
          </label>

          <Select label="Tipo" value={type} options={TYPE_OPTIONS} onChange={setType} />

          <label className={field}>
            Placa <span className={opt}>(opcional)</span>
            <input
              className={input}
              value={plate}
              onChange={(e) => setPlate(maskPlate(e.target.value))}
              placeholder="ABC1D23"
              maxLength={plateMaxLength()}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <small className={hint}>{format ? `Placa ${format.label}` : plateHint()}</small>
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
