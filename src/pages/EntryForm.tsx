import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import CategorySelect from '../components/CategorySelect';
import ServiceItemsField, { findReminder, isOilChange, newItem, type ItemDraft } from '../components/ServiceItemsField';
import OilChangeField from '../components/OilChangeField';
import { useUid } from '../auth';
import { useEntries, useReminders, useVehicle } from '../hooks';
import { deleteEntry, markReminderDone, saveEntry, saveReminder, syncVehicleOdometer } from '../db';
import { ENTRY_KINDS, EXPENSE_CATEGORIES, FUEL_TYPES, normalizeCategory, OIL_CHANGE, SERVICE_CATEGORIES } from '../constants';
import { currentOdometer, serviceItems, sumItems } from '../lib/calc';
import { today } from '../lib/dates';
import { km, MAX_KM_DIGITS, maskKm, maskMoney, parseDecimal, parseInteger, toInput } from '../lib/format';
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
  const [title, setTitle] = useState(entry?.title ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  // abastecimento
  const [fuelType, setFuelType] = useState(entry?.fuelType ?? lastFuelType(others));
  const [price, setPrice] = useState(toInput(entry?.pricePerLiter, 2));
  const [liters, setLiters] = useState(toInput(entry?.liters, 2));
  const [fullTank, setFullTank] = useState(entry?.fullTank ?? true);
  // serviço: lista do que foi feito (serviço antigo vira um item só)
  const [items, setItems] = useState<ItemDraft[]>(() =>
    kind !== 'service' ? [] : entry ? serviceItems(entry).map((i) => newItem(i.category, toInput(i.amount, 2))) : [newItem()],
  );
  const [reminderId, setReminderId] = useState('');
  // troca de óleo (só em serviço novo): intervalo da próxima → lembrete
  const [oilKm, setOilKm] = useState<number | null>(null);
  const [oilMonths, setOilMonths] = useState<number | null>(null);
  const [error, setError] = useState('');

  const electric = fuelType === 'Recarga elétrica';
  const unit = electric ? 'kWh' : 'L';
  const odoNum = parseInteger(odo);
  const odoBelow = odoNum != null && !entry && odoNum < lastKm;
  // lembretes da próxima troca: só em serviço novo (contam a partir do km e da data dele)
  const allowReminders = kind === 'service' && !entry;
  const hasOilChange = allowReminders && items.some((i) => isOilChange(i.category));
  const oilMissing = hasOilChange && (oilKm == null || oilMonths == null);
  const reminderItems = allowReminders ? items.filter((i) => i.remind && i.category && !isOilChange(i.category)) : [];
  // serviços com lembrete próprio já reiniciam ao salvar: fora do "Concluir lembrete"
  const handled = (title: string) =>
    (hasOilChange && isOilChange(title)) || reminderItems.some((i) => normalizeCategory(i.category) === normalizeCategory(title));

  const otherReminders = reminders.filter((r) => !handled(r.title));

  /** Cria ou atualiza o lembrete do veículo com este nome — nunca duplica. */
  function upsertReminder(title: string, intervalKm: number | null, intervalMonths: number | null) {
    const existing = findReminder(reminders, title);
    saveReminder(uid, vid, existing?.id, {
      title: existing?.title ?? title,
      intervalKm,
      intervalMonths,
      lastKm: odoNum ?? lastKm,
      lastDate: day,
      createdAt: existing?.createdAt ?? Date.now(),
    });
  }

  // total ÷ preço → litros; litros × preço → total (tudo com duas casas, formatado ao digitar)
  function onAmount(raw: string) {
    const s = maskMoney(raw);
    setAmount(s);
    const t = parseDecimal(s);
    const p = parseDecimal(price);
    if (kind === 'fuel' && t && p) setLiters(toInput(t / p, 2));
  }
  function onPrice(raw: string) {
    const s = maskMoney(raw);
    setPrice(s);
    const t = parseDecimal(amount);
    const p = parseDecimal(s);
    if (t && p) setLiters(toInput(t / p, 2));
  }
  function onLiters(raw: string) {
    const s = maskMoney(raw);
    setLiters(s);
    const l = parseDecimal(s);
    const p = parseDecimal(price);
    if (l && p) setAmount(toInput(l * p, 2));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const isService = kind === 'service';
    const serviceList = items.map((i) => ({ category: i.category, amount: Math.round((parseDecimal(i.amount) ?? 0) * 100) / 100 }));
    if (isService && serviceList.some((i) => !i.category)) return setError('Escolha o serviço de cada item.');
    if (oilMissing) return setError('Escolha o intervalo da próxima troca de óleo: um de km e um de meses.');
    const itemReminders = reminderItems.map((i) => ({
      title: i.category,
      km: parseInteger(i.remindKm) || null,
      months: parseInteger(i.remindMonths) || null,
    }));
    const incomplete = itemReminders.find((r) => !r.km && !r.months);
    if (incomplete) return setError(`Informe em quantos km ou meses lembrar de "${incomplete.title}" (ou desligue o lembrete).`);
    const value = isService ? sumItems(serviceList) : parseDecimal(amount);
    if (!value || value <= 0) return setError(isService ? 'Informe o valor de pelo menos um item.' : 'Informe o valor.');
    if (!day) return setError('Informe a data.');

    const base = {
      kind,
      date: day,
      odometer: odoNum,
      amount: Math.round(value * 100) / 100,
      category: kind === 'fuel' ? 'Combustível' : isService ? serviceList[0].category : category,
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
      // um item só: grava como antes (sem lista); vários: a lista, e amount/category resumem
      saveEntry(
        uid,
        vid,
        entry?.id,
        isService
          ? { ...base, title: title.trim() || undefined, items: serviceList.length > 1 ? serviceList : undefined }
          : base,
      );
      if (isService && reminderId) markReminderDone(uid, vid, reminderId, odoNum ?? lastKm, day);
      if (hasOilChange) upsertReminder(OIL_CHANGE, oilKm, oilMonths);
      for (const r of itemReminders) upsertReminder(r.title, r.km, r.months);
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
              <input className={input} value={odo} onChange={(e) => setOdo(maskKm(e.target.value))} inputMode="numeric" pattern="[0-9]*" maxLength={MAX_KM_DIGITS} placeholder={String(lastKm)} />
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
                  <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" placeholder="0,00" />
                </label>
                <label className={field}>
                  Preço / {unit}
                  <input className={input} value={price} onChange={(e) => onPrice(e.target.value)} inputMode="numeric" placeholder="0,00" />
                </label>
              </div>
              <label className={field}>
                Quantidade ({unit})
                <input className={input} value={liters} onChange={(e) => onLiters(e.target.value)} inputMode="numeric" placeholder="calculado" />
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

          {kind === 'service' && (
            <>
              <label className={field}>
                Título <span className={opt}>(opcional)</span>
                <input
                  className={input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Revisão dos 60 mil km"
                  maxLength={60}
                />
              </label>
              <ServiceItemsField
                uid={uid}
                items={items}
                onChange={setItems}
                reminders={reminders}
                allowReminders={allowReminders}
                fromKm={odoNum ?? lastKm}
                fromDate={day || today()}
              />
              {hasOilChange && (
                <OilChangeField
                  km={oilKm}
                  months={oilMonths}
                  onKm={setOilKm}
                  onMonths={setOilMonths}
                  fromKm={odoNum ?? lastKm}
                  fromDate={day || today()}
                />
              )}
              <label className={field}>
                Descrição <span className={opt}>(opcional)</span>
                <input
                  className={input}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: revisão dos 60 mil km"
                />
              </label>
            </>
          )}

          {kind === 'expense' && (
            <>
              <CategorySelect uid={uid} kind={kind} value={category} onChange={setCategory} />
              <label className={field}>
                Descrição <span className={opt}>(opcional)</span>
                <input
                  className={input}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: IPVA 2027 — cota única"
                />
              </label>
              <label className={field}>
                Valor (R$)
                <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" placeholder="0,00" />
              </label>
            </>
          )}

          {kind === 'service' && !entry && otherReminders.length > 0 && (
            <label className={field}>
              Concluir lembrete <span className={opt}>(opcional)</span>
              <select className={input} value={reminderId} onChange={(e) => setReminderId(e.target.value)}>
                <option value="">— nenhum —</option>
                {otherReminders.map((r) => (
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
          <button className={`${btn('primary')} w-full`} type="submit" disabled={oilMissing}>
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
