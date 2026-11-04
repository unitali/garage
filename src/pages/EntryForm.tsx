import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import Header from '../components/Header';
import FuelCalculator from '../components/FuelCalculator';
import Select from '../components/Select';
import Sheet from '../components/Sheet';
import CategorySelect from '../components/CategorySelect';
import ServiceItemsField, { findReminder, isOilChange, newItem, withExistingReminder, type ItemDraft } from '../components/ServiceItemsField';
import OilChangeField from '../components/OilChangeField';
import ExpensePaymentField, { DEFAULT_COUNT, type PayMode, type ScheduleRow } from '../components/ExpensePaymentField';
import { useUid } from '../auth';
import { useEntries, useReminders, useVehicle } from '../hooks';
import { deleteEntries, deleteEntry, markReminderDone, saveEntry, saveEntrySeries, saveReminder, syncVehicleOdometer } from '../db';
import { ENTRY_KINDS, EXPENSE_CATEGORIES, FUEL_TYPES, normalizeCategory, OIL_CHANGE, OIL_KM_OPTIONS, OIL_MONTH_OPTIONS, SERVICE_CATEGORIES } from '../constants';
import { currentOdometer, isOpenBill, serviceItems, sumItems } from '../lib/calc';
import { today } from '../lib/dates';
import { isKeyOf } from '../lib/keys';
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
  // estável entre renders: o km atual (useMemo no formulário) não é recalculado a cada tecla
  const others = useMemo(() => entries.data.filter((e) => e.id !== eid), [entries.data, eid]);

  if (vehicle.loading || entries.loading || reminders.loading) return <div className={splash}>Carregando…</div>;
  if (!vehicle.data || !vid) return <div className={splash}>Veículo não encontrado.</div>;

  const entry = eid ? entries.data.find((e) => e.id === eid) ?? null : null;
  if (eid && !entry) return <div className={splash}>Registro não encontrado.</div>;

  const kindParam = params.get('kind');
  const kind: EntryKind = entry?.kind ?? (kindParam && isKeyOf(ENTRY_KINDS, kindParam) ? kindParam : 'fuel');

  return (
    <EntryForm
      key={eid ?? 'new'}
      uid={uid}
      vid={vid}
      vehicle={vehicle.data}
      kind={kind}
      entry={entry}
      others={others}
      reminders={reminders.data}
      // "Registrar serviço" do card Próxima manutenção: já com o lembrete selecionado
      preset={kind === 'service' && !entry ? reminders.data.find((r) => r.id === params.get('lembrete')) : undefined}
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
  /** serviço novo já com este lembrete como item */
  preset?: Reminder;
}

const FUEL_OPTIONS = FUEL_TYPES.map((f) => ({ value: f, label: f }));

function lastFuelType(others: Entry[]) {
  const fuels = others.filter((e) => e.kind === 'fuel' && e.fuelType).sort((a, b) => b.date.localeCompare(a.date));
  return fuels[0]?.fuelType ?? FUEL_TYPES[0];
}

function EntryForm({ uid, vid, vehicle, kind, entry, others, reminders, preset }: Props) {
  const navigate = useNavigate();
  const back = paths.vehicle(vid, 'historico');
  const lastKm = useMemo(() => currentOdometer(vehicle, others), [vehicle, others]);

  const [day, setDay] = useState(entry?.date ?? today());
  const [odo, setOdo] = useState(entry?.odometer != null ? String(entry.odometer) : '');
  const [amount, setAmount] = useState(toInput(entry?.amount, 2));
  const [category, setCategory] = useState(entry?.category ?? (kind === 'service' ? SERVICE_CATEGORIES[0] : EXPENSE_CATEGORIES[0]));
  const [title, setTitle] = useState(entry?.title ?? '');
  // o campo "descrição" saiu: a de registros antigos passa para observações (nada se perde)
  const [notes, setNotes] = useState(() => [entry?.description, entry?.notes].filter(Boolean).join('\n'));
  // abastecimento
  const [fuelType, setFuelType] = useState(entry?.fuelType ?? lastFuelType(others));
  const [price, setPrice] = useState(toInput(entry?.pricePerLiter, 2));
  const [liters, setLiters] = useState(toInput(entry?.liters, 2));
  const [fullTank, setFullTank] = useState(entry?.fullTank ?? true);
  // calculadora etanol x gasolina num painel (o formulário fica como está por trás)
  const [calcOpen, setCalcOpen] = useState(false);
  // serviço: lista do que foi feito (serviço antigo vira um item só)
  const [items, setItems] = useState<ItemDraft[]>(() =>
    kind !== 'service'
      ? []
      : entry
        ? serviceItems(entry).map((i) => withExistingReminder(newItem(i.category, toInput(i.amount, 2)), reminders))
        : [preset ? withExistingReminder(newItem(preset.title), reminders) : newItem()],
  );
  const [reminderId, setReminderId] = useState('');
  // despesa nova: cota única, parcelado ou recorrente (uma despesa por vencimento)
  const [payMode, setPayMode] = useState<PayMode>('single');
  const [count, setCount] = useState(DEFAULT_COUNT.installments);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const isNewSeries = kind === 'expense' && !entry && payMode !== 'single';
  // despesa que é conta (parcela ou futura): pode marcar/desmarcar "Pago"
  // toda despesa pode ser marcada como paga (verde no histórico); desmarcada, vira conta em aberto
  // e vai para os lembretes do mês. Nova: marcada se a data é hoje ou antes (até a pessoa mexer).
  const [paidChoice, setPaidChoice] = useState<boolean | null>(() =>
    entry ? (entry.paid ?? (!!entry.series && !isOpenBill(entry))) : null,
  );
  const paid = paidChoice ?? day <= today();
  const showPaid = kind === 'expense' && (!!entry || payMode === 'single');
  // parcelas da mesma série (para "excluir todas")
  const seriesIds = entry?.series ? [entry.id, ...others.filter((o) => o.series?.id === entry.series!.id).map((o) => o.id)] : [];
  // troca de óleo (só em serviço novo): intervalo da próxima → lembrete
  // editando, ou vindo do lembrete de óleo: badges já marcados com o intervalo atual
  const currentOil = entry || (preset && isOilChange(preset.title)) ? findReminder(reminders, OIL_CHANGE) : undefined;
  const [oilKm, setOilKm] = useState<number | null>(() =>
    currentOil?.intervalKm && OIL_KM_OPTIONS.includes(currentOil.intervalKm) ? currentOil.intervalKm : null,
  );
  const [oilMonths, setOilMonths] = useState<number | null>(() =>
    currentOil?.intervalMonths && OIL_MONTH_OPTIONS.includes(currentOil.intervalMonths) ? currentOil.intervalMonths : null,
  );
  const [error, setError] = useState('');

  const electric = fuelType === 'Recarga elétrica';
  const unit = electric ? 'kWh' : 'L';
  const odoNum = parseInteger(odo);
  const odoBelow = odoNum != null && !entry && odoNum < lastKm;
  // lembretes da próxima troca (novo ou editando): contam a partir do km e da data deste serviço
  const allowReminders = kind === 'service';
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
    // serviço mais antigo que a última vez registrada no lembrete: só atualiza o intervalo
    const newer = !existing?.lastDate || day >= existing.lastDate;
    saveReminder(
      uid,
      vid,
      existing?.id,
      {
        title: existing?.title ?? title,
        intervalKm,
        intervalMonths,
        lastKm: newer ? (odoNum ?? lastKm) : existing.lastKm,
        lastDate: newer ? day : existing.lastDate,
        createdAt: existing?.createdAt ?? Date.now(),
      },
      existing,
    );
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
    if (isNewSeries) return submitSeries();
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
      description: '',
      notes: notes.trim(),
      createdAt: entry?.createdAt ?? Date.now(),
    };

    if (kind === 'fuel') {
      const l = parseDecimal(liters);
      if (odoNum == null) return setError('No abastecimento o km é obrigatório (é com ele que o consumo é calculado).');
      if (!l || l <= 0) return setError(`Informe a quantidade (${unit}).`);
      saveEntry(
        uid,
        vid,
        entry?.id,
        {
          ...base,
          fuelType,
          liters: l,
          pricePerLiter: parseDecimal(price) ?? Math.round((value / l) * 1000) / 1000,
          fullTank,
        },
        entry,
      );
    } else {
      // um item só: grava como antes (sem lista); vários: a lista, e amount/category resumem
      saveEntry(
        uid,
        vid,
        entry?.id,
        isService
          ? { ...base, title: title.trim() || undefined, items: serviceList.length > 1 ? serviceList : undefined }
          : {
              ...base,
              series: entry?.series, // parcela editada continua na série
              // conta: o que estiver marcado; despesa nova com vencimento futuro nasce em aberto
              paid: kind === 'expense' ? paid : undefined,
            },
        entry,
      );
      if (isService && reminderId) markReminderDone(uid, vid, reminderId, odoNum ?? lastKm, day, reminders.find((r) => r.id === reminderId));
      if (hasOilChange) upsertReminder(OIL_CHANGE, oilKm, oilMonths);
      for (const r of itemReminders) upsertReminder(r.title, r.km, r.months);
    }
    if (odoNum != null && odoNum > (vehicle.odometer ?? 0)) syncVehicleOdometer(uid, vid, odoNum);
    navigate(back, { replace: true });
  }

  /** Parcelado/recorrente: uma despesa por vencimento, gravadas juntas e ligadas pela série. */
  function submitSeries() {
    if (!category) return setError('Escolha a categoria.');
    if (schedule.length === 0) return setError('Informe o valor.');
    const list = schedule.map((r) => ({ date: r.date, amount: Math.round((parseDecimal(r.amount) ?? 0) * 100) / 100 }));
    const bad = list.findIndex((r) => !r.date || r.amount <= 0);
    if (bad >= 0) return setError(`Confira a data e o valor da ${bad + 1}ª parcela.`);
    const now = Date.now();
    saveEntrySeries(
      uid,
      vid,
      list.map((r, i) => ({
        kind: 'expense' as const,
        date: r.date,
        odometer: i === 0 ? odoNum : null, // km só faz sentido no primeiro (o de hoje)
        amount: r.amount,
        category,
        description: '',
        notes: notes.trim(),
        createdAt: now + i,
        series: { type: payMode as 'installments' | 'recurring', index: i + 1, count: list.length },
        // contas: em aberto aparecem nos lembretes do mês até marcar "Pago"
        paid: r.date < today(),
      })),
    );
    if (odoNum != null && odoNum > (vehicle.odometer ?? 0)) syncVehicleOdometer(uid, vid, odoNum);
    navigate(back, { replace: true });
  }

  function remove() {
    if (!entry || !confirm('Excluir este registro?')) return;
    deleteEntry(uid, vid, entry.id);
    navigate(back, { replace: true });
  }

  function removeSeries() {
    if (!confirm(`Excluir todas as ${seriesIds.length} parcelas desta despesa?`)) return;
    deleteEntries(uid, vid, seriesIds);
    navigate(back, { replace: true });
  }

  const meta = ENTRY_KINDS[kind];

  return (
    <>
      <Header title={`${entry ? 'Editar' : 'Novo'} ${meta.label.toLowerCase()}`} vehicle={vehicle} back={back} />
      <main className={main}>
        <form className={form} onSubmit={submit}>
          <div className={grid2}>
            <label className={field}>
              {isNewSeries ? '1º vencimento' : 'Data'}
              <input
                className={input}
                type="date"
                value={day}
                max={kind === 'expense' ? undefined : today()}
                onChange={(e) => setDay(e.target.value)}
              />
            </label>
            <label className={field}>
              Km {kind !== 'fuel' && <span className={opt}>(opcional)</span>}
              <input className={input} value={odo} onChange={(e) => setOdo(maskKm(e.target.value))} inputMode="numeric" pattern="[0-9]*" maxLength={MAX_KM_DIGITS} placeholder={String(lastKm)} />
            </label>
          </div>
          {odoBelow && <p className="text-sm text-orange-700 dark:text-orange-400">Atenção: menor que o último km registrado ({km(lastKm)}).</p>}

          {kind === 'fuel' && (
            <>
              {vehicle.type !== 'bike' && (
                <button type="button" className={`${btn('default')} w-full gap-2`} onClick={() => setCalcOpen(true)}>
                  <Calculator className="size-5" aria-hidden />
                  Etanol ou gasolina? Calcular
                </button>
              )}
              <Select label="Combustível" value={fuelType} options={FUEL_OPTIONS} onChange={setFuelType} />
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
            </>
          )}

          {kind === 'expense' && (
            <>
              <CategorySelect uid={uid} kind={kind} value={category} onChange={setCategory} />
              {entry ? (
                <>
                  {entry.series && (
                    <p className="rounded-xl bg-brand-soft p-2.5 text-sm">
                      {entry.series.type === 'installments' ? 'Parcela' : 'Recorrente'} {entry.series.index} de {entry.series.count} — as
                      alterações valem só para esta.
                    </p>
                  )}
                  <label className={field}>
                    Valor (R$)
                    <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" placeholder="0,00" />
                  </label>
                </>
              ) : (
                <ExpensePaymentField
                  mode={payMode}
                  onMode={(m) => {
                    setPayMode(m);
                    if (m !== 'single') setCount(DEFAULT_COUNT[m]);
                  }}
                  amount={amount}
                  onAmount={onAmount}
                  count={count}
                  onCount={setCount}
                  rows={schedule}
                  onRows={setSchedule}
                  firstDate={day || today()}
                />
              )}
              {showPaid && (
                <label className={checkField}>
                  <input className={checkbox} type="checkbox" checked={paid} onChange={(e) => setPaidChoice(e.target.checked)} />
                  <span>
                    Pago
                    <small className={hint}> — sem marcar, vira conta em aberto e aparece nos lembretes do mês</small>
                  </span>
                </label>
              )}
            </>
          )}

          {kind === 'service' && !entry && otherReminders.length > 0 && (
            <Select
              label={
                <>
                  Concluir lembrete <span className={opt}>(opcional)</span>
                </>
              }
              value={reminderId}
              options={[{ value: '', label: '— nenhum —' }, ...otherReminders.map((r) => ({ value: r.id, label: r.title }))]}
              onChange={setReminderId}
              hint="Reinicia a contagem do lembrete a partir desta data e km."
            />
          )}

          <label className={field}>
            Observações <span className={opt}>(opcional)</span>
            <textarea className={input} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} placeholder={kind === 'fuel' ? 'Posto, etc.' : kind === 'service' ? 'Oficina, garantia, peças…' : 'Ex: IPVA 2027 — cota única'} />
          </label>

          {error && <p className={errorText}>{error}</p>}
          <button className={`${btn('primary')} w-full`} type="submit" disabled={oilMissing}>
            Salvar
          </button>
          {entry && (
            <button type="button" className={`${btn('danger')} w-full`} onClick={remove}>
              {entry.series ? 'Excluir só esta parcela' : 'Excluir registro'}
            </button>
          )}
          {entry && seriesIds.length > 1 && (
            <button type="button" className={`${btn('danger')} w-full`} onClick={removeSeries}>
              Excluir todas as parcelas ({seriesIds.length})
            </button>
          )}
        </form>
        <Sheet open={calcOpen} onClose={() => setCalcOpen(false)} title="Calculadora" subtitle="Compensa etanol ou gasolina?">
          <FuelCalculator
            entries={others}
            // o preço já digitado no formulário vale mais que o último registrado
            initial={fuelType === 'Etanol' || fuelType === 'Gasolina' ? { [fuelType]: price } : {}}
            onUse={(fuel, p) => {
              setFuelType(fuel);
              onPrice(p);
              setCalcOpen(false);
            }}
          />
        </Sheet>
      </main>
    </>
  );
}
