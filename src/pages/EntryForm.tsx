import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { useUid } from '../auth';
import { useEntries, useReminders, useVehicle } from '../hooks';
import { deleteEntry, markReminderDone, saveEntry, syncVehicleOdometer } from '../db';
import { ENTRY_KINDS, EXPENSE_CATEGORIES, FUEL_TYPES, SERVICE_CATEGORIES } from '../constants';
import { currentOdometer } from '../lib/calc';
import { today } from '../lib/dates';
import { km, parseDecimal, parseInteger, toInput } from '../lib/format';
import type { Entry, EntryKind, Reminder, Vehicle } from '../types';
import { btn, checkbox, checkField, error as errorText, field, form, grid2, hint, input, main, opt, splash } from '../ui';
import { paths } from '../routes/paths';

export default function EntryFormPage() {
  const { vid, eid } = useParams();
  const [params] = useSearchParams();
  const uid = useUid();
  const vehicle = useVehicle(uid, vid);
  const entries = useEntries(uid, vid);
  const reminders = useReminders(uid, vid);

  if (vehicle.loading || entries.loading) return <div className={splash}>Carregando…</div>;
  if (!vehicle.data || !vid) return <div className={splash}>Veículo não encontrado.</div>;

  const entry = eid ? entries.data.find((e) => e.id === eid) ?? null : null;
  if (eid && !entry) return <div className={splash}>Registro não encontrado.</div>;

  const kindParam = params.get('kind') as EntryKind | null;
  const kind: EntryKind = entry?.kind ?? (kindParam && kindParam in ENTRY_KINDS ? kindParam : 'fuel');

  return (
    <EntryForm
      key={eid ?? 'new'}
      uid={uid}
      vid={vid}
      vehicle={vehicle.data}
      kind={kind}
      entry={entry}
      others={entries.data.filter((e) => e.id !== eid)}
      reminders={reminders.data}
    />
  );
}

interface Props {
  uid: string;
  vid: string;
  vehicle: Vehicle;
  kind: EntryKind;
  entry: Entry | null;
  others: Entry[];
  reminders: Reminder[];
}

function lastFuelType(others: Entry[]) {
  const fuels = others.filter((e) => e.kind === 'fuel' && e.fuelType).sort((a, b) => b.date.localeCompare(a.date));
  return fuels[0]?.fuelType ?? FUEL_TYPES[0];
}

function EntryForm({ uid, vid, vehicle, kind, entry, others, reminders }: Props) {
  const navigate = useNavigate();
  const back = paths.vehicle(vid, 'historico');
  const lastKm = useMemo(() => currentOdometer(vehicle, others), [vehicle, others]);

  const [day, setDay] = useState(entry?.date ?? today());
  const [odo, setOdo] = useState(entry?.odometer != null ? String(entry.odometer) : '');
  const [amount, setAmount] = useState(toInput(entry?.amount, 2));
  const [category, setCategory] = useState(entry?.category ?? (kind === 'service' ? SERVICE_CATEGORIES[0] : EXPENSE_CATEGORIES[0]));
  const [description, setDescription] = useState(entry?.description ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  // abastecimento
  const [fuelType, setFuelType] = useState(entry?.fuelType ?? lastFuelType(others));
  const [price, setPrice] = useState(toInput(entry?.pricePerLiter, 2));
  const [liters, setLiters] = useState(toInput(entry?.liters, 2));
  const [fullTank, setFullTank] = useState(entry?.fullTank ?? true);
  // serviço
  const [reminderId, setReminderId] = useState('');
  const [error, setError] = useState('');

  const electric = fuelType === 'Recarga elétrica';
  const unit = electric ? 'kWh' : 'L';
  const odoNum = parseInteger(odo);
  const odoBelow = odoNum != null && !entry && odoNum < lastKm;

  // total ÷ preço → litros; litros × preço → total
  function onAmount(s: string) {
    setAmount(s);
    const t = parseDecimal(s);
    const p = parseDecimal(price);
    if (kind === 'fuel' && t && p) setLiters(toInput(t / p, 2));
  }
  function onPrice(s: string) {
    setPrice(s);
    const t = parseDecimal(amount);
    const p = parseDecimal(s);
    if (t && p) setLiters(toInput(t / p, 2));
  }
  function onLiters(s: string) {
    setLiters(s);
    const l = parseDecimal(s);
    const p = parseDecimal(price);
    if (l && p) setAmount(toInput(l * p, 2));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseDecimal(amount);
    if (!value || value <= 0) return setError('Informe o valor.');
    if (!day) return setError('Informe a data.');

    const base = {
      kind,
      date: day,
      odometer: odoNum,
      amount: Math.round(value * 100) / 100,
      category: kind === 'fuel' ? 'Combustível' : category,
      description: description.trim(),
      notes: notes.trim(),
      createdAt: entry?.createdAt ?? Date.now(),
    };

    if (kind === 'fuel') {
      const l = parseDecimal(liters);
      if (odoNum == null) return setError('No abastecimento o km é obrigatório (é com ele que o consumo é calculado).');
      if (!l || l <= 0) return setError(`Informe a quantidade (${unit}).`);
      saveEntry(uid, vid, entry?.id, {
        ...base,
        fuelType,
        liters: l,
        pricePerLiter: parseDecimal(price) ?? Math.round((value / l) * 1000) / 1000,
        fullTank,
      });
    } else {
      saveEntry(uid, vid, entry?.id, base);
      if (kind === 'service' && reminderId) markReminderDone(uid, vid, reminderId, odoNum ?? lastKm, day);
    }
    if (odoNum != null && odoNum > (vehicle.odometer ?? 0)) syncVehicleOdometer(uid, vid, odoNum);
    navigate(back, { replace: true });
  }

  function remove() {
    if (!entry || !confirm('Excluir este registro?')) return;
    deleteEntry(uid, vid, entry.id);
    navigate(back, { replace: true });
  }

  const meta = ENTRY_KINDS[kind];

  return (
    <>
      <Header title={`${entry ? 'Editar' : 'Novo'} ${meta.label.toLowerCase()}`} subtitle={vehicle.name} back={back} />
      <main className={main}>
        <form className={form} onSubmit={submit}>
          <div className={grid2}>
            <label className={field}>
              Data
              <input className={input} type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} />
            </label>
            <label className={field}>
              Km {kind !== 'fuel' && <span className={opt}>(opcional)</span>}
              <input className={input} value={odo} onChange={(e) => setOdo(e.target.value)} inputMode="numeric" placeholder={String(lastKm)} />
            </label>
          </div>
          {odoBelow && <p className="text-sm text-warn">Atenção: menor que o último km registrado ({km(lastKm)}).</p>}

          {kind === 'fuel' && (
            <>
              <label className={field}>
                Combustível
                <select className={input} value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                  {FUEL_TYPES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <div className={grid2}>
                <label className={field}>
                  Valor total (R$)
                  <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
                </label>
                <label className={field}>
                  Preço / {unit}
                  <input className={input} value={price} onChange={(e) => onPrice(e.target.value)} inputMode="decimal" placeholder="0,00" />
                </label>
              </div>
              <label className={field}>
                Quantidade ({unit})
                <input className={input} value={liters} onChange={(e) => onLiters(e.target.value)} inputMode="decimal" placeholder="calculado" />
              </label>
              <label className={checkField}>
                <input className={checkbox} type="checkbox" checked={fullTank} onChange={(e) => setFullTank(e.target.checked)} />
                <span>
                  {electric ? 'Carga completa' : 'Tanque cheio'}
                  <small className={hint}> — o consumo é calculado entre dois abastecimentos completos</small>
                </span>
              </label>
            </>
          )}

          {kind !== 'fuel' && (
            <>
              <label className={field}>
                Categoria
                <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {(kind === 'service' ? SERVICE_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className={field}>
                Descrição <span className={opt}>(opcional)</span>
                <input className={input}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={kind === 'service' ? 'Ex: óleo 5W30 + filtro de óleo' : 'Ex: IPVA 2027 — cota única'}
                />
              </label>
              <label className={field}>
                Valor (R$)
                <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
              </label>
            </>
          )}

          {kind === 'service' && !entry && reminders.length > 0 && (
            <label className={field}>
              Concluir lembrete <span className={opt}>(opcional)</span>
              <select className={input} value={reminderId} onChange={(e) => setReminderId(e.target.value)}>
                <option value="">— nenhum —</option>
                {reminders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <small className={hint}>Reinicia a contagem do lembrete a partir desta data e km.</small>
            </label>
          )}

          <label className={field}>
            Observações <span className={opt}>(opcional)</span>
            <textarea className={input} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={kind === 'fuel' ? 'Posto, etc.' : 'Oficina, garantia, etc.'} />
          </label>

          {error && <p className={errorText}>{error}</p>}
          <button className={`${btn('primary')} w-full`} type="submit">
            Salvar
          </button>
          {entry && (
            <button type="button" className={`${btn('danger')} w-full`} onClick={remove}>
              Excluir registro
            </button>
          )}
        </form>
      </main>
    </>
  );
}
