import { Bell, BellRing, Plus, Trash2, X } from 'lucide-react';
import CategorySelect from './CategorySelect';
import { normalizeCategory, OIL_CHANGE } from '../constants';
import { sumItems } from '../lib/calc';
import { addMonths } from '../lib/dates';
import { brl, date, digitsOnly, km, maskKm, maskMoney, MAX_KM_DIGITS, parseDecimal, parseInteger } from '../lib/format';
import type { Reminder } from '../types';
import { field, fieldset, grid2, input, legend } from '../ui';

/** Item em edição: valor como texto da máscara ("1.234,56"); `remind*` = lembrete opcional da próxima. */
export interface ItemDraft {
  key: number;
  category: string;
  amount: string;
  remind: boolean;
  remindKm: string;
  remindMonths: string;
}

let nextKey = 0;
export const newItem = (category = '', amount = ''): ItemDraft => ({
  key: ++nextKey,
  category,
  amount,
  remind: false,
  remindKm: '',
  remindMonths: '',
});

export const draftsTotal = (items: ItemDraft[]) => sumItems(items.map((i) => ({ amount: parseDecimal(i.amount) ?? 0 })));

export const isOilChange = (category: string) => normalizeCategory(category) === normalizeCategory(OIL_CHANGE);

/** Lembrete do veículo com o mesmo nome do item (ex: "Correia dentada"). */
export const findReminder = (reminders: Reminder[], category: string) =>
  reminders.find((r) => normalizeCategory(r.title) === normalizeCategory(category));

/** Colunas de cada linha: serviço (resto) · valor · remover */
const row = 'grid grid-cols-[minmax(0,1fr)_7.5rem_2.25rem] gap-2';

/** Se o veículo já tem lembrete para este serviço, o item vem com ele ligado e o intervalo atual. */
export function withExistingReminder(item: ItemDraft, reminders: Reminder[]): ItemDraft {
  const r = findReminder(reminders, item.category);
  if (!r || isOilChange(item.category)) return item;
  return { ...item, remind: true, remindKm: r.intervalKm ? String(r.intervalKm) : '', remindMonths: r.intervalMonths ? String(r.intervalMonths) : '' };
}

/** Lista do que foi feito no serviço (categoria + valor de cada item), o total e o lembrete opcional de cada item. */
export default function ServiceItemsField({
  uid,
  items,
  onChange,
  reminders,
  allowReminders,
  fromKm,
  fromDate,
}: {
  uid: string;
  items: ItemDraft[];
  onChange: (items: ItemDraft[]) => void;
  reminders: Reminder[];
  /** o lembrete conta a partir do km e da data deste serviço */
  allowReminders: boolean;
  fromKm: number;
  fromDate: string;
}) {
  const update = (key: number, patch: Partial<ItemDraft>) => onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  function changeCategory(item: ItemDraft, category: string) {
    // já existe lembrete para este serviço? vem ligado com o intervalo atual
    const changed = { ...item, category };
    const next = allowReminders ? withExistingReminder(changed, reminders) : changed;
    onChange(items.map((i) => (i.key === item.key ? next : i)));
  }

  return (
    <fieldset className={fieldset}>
      <legend className={legend}>O que foi feito</legend>
      {/* item e valor sempre na mesma linha; títulos das colunas uma vez só */}
      <div className={`${row} text-sm font-semibold`} aria-hidden>
        <span>Serviço</span>
        <span>Valor (R$)</span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <li key={item.key} className={`${row} items-center`}>
            <CategorySelect
              uid={uid}
              kind="service"
              compact
              label={`Serviço do item ${idx + 1}`}
              value={item.category}
              onChange={(category) => changeCategory(item, category)}
            />
            <input
              className={`${input} text-right`}
              value={item.amount}
              onChange={(e) => update(item.key, { amount: maskMoney(e.target.value) })}
              inputMode="numeric"
              placeholder="0,00"
              aria-label={`Valor do item ${idx + 1}`}
            />
            {items.length > 1 ? (
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg text-red-700 dark:text-red-400 active:bg-slate-100 dark:active:bg-slate-950"
                aria-label={`Remover item ${idx + 1}`}
                onClick={() => onChange(items.filter((i) => i.key !== item.key))}
              >
                <Trash2 className="size-5" />
              </button>
            ) : (
              <span />
            )}

            {/* troca de óleo tem os badges próprios (OilChangeField) */}
            {allowReminders && item.category && !isOilChange(item.category) && (
              <ItemReminder item={item} update={(patch) => update(item.key, patch)} fromKm={fromKm} fromDate={fromDate} />
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-2.5 text-sm font-semibold text-brand"
        onClick={() => onChange([...items, newItem()])}
      >
        <Plus className="size-4" />
        Adicionar item
      </button>

      <div className="mt-1 flex items-baseline justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
        <span className="font-semibold">Total{items.length > 1 ? ` (${items.length} itens)` : ''}</span>
        <strong className="text-lg">{brl(draftsTotal(items))}</strong>
      </div>
    </fieldset>
  );
}

function ItemReminder({
  item,
  update,
  fromKm,
  fromDate,
}: {
  item: ItemDraft;
  update: (patch: Partial<ItemDraft>) => void;
  fromKm: number;
  fromDate: string;
}) {
  if (!item.remind)
    return (
      <button
        type="button"
        className="order-last col-span-full flex items-center gap-1.5 justify-self-start pb-1 text-sm font-semibold text-brand"
        onClick={() => update({ remind: true })}
      >
        <Bell className="size-4" />
        Lembrar da próxima troca
      </button>
    );

  const everyKm = parseInteger(item.remindKm);
  const everyMonths = parseInteger(item.remindMonths);
  const next = [everyKm ? km(fromKm + everyKm) : null, everyMonths ? date(addMonths(fromDate, everyMonths)) : null].filter(Boolean);

  return (
    <div className="order-last col-span-full mb-1 flex flex-col gap-2 rounded-xl bg-brand-soft/60 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <BellRing className="size-4 text-brand" />
          Lembrar da próxima troca
        </span>
        <button type="button" className="text-slate-600 dark:text-slate-400" aria-label="Sem lembrete" onClick={() => update({ remind: false, remindKm: '', remindMonths: '' })}>
          <X className="size-5" />
        </button>
      </div>
      <div className={grid2}>
        <label className={field}>
          A cada (km)
          <input
            className={input}
            value={item.remindKm}
            onChange={(e) => update({ remindKm: maskKm(e.target.value) })}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={MAX_KM_DIGITS}
            placeholder="50000"
          />
        </label>
        <label className={field}>
          ou a cada (meses)
          <input
            className={input}
            value={item.remindMonths}
            onChange={(e) => update({ remindMonths: digitsOnly(e.target.value, 3) })}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            placeholder="48"
          />
        </label>
      </div>
      <small className="text-xs text-slate-600 dark:text-slate-400">
        {next.length ? `Próxima: ${next.join(' ou ')}${next.length > 1 ? ', o que vier primeiro' : ''}.` : 'Preencha km, meses ou os dois.'}
      </small>
    </div>
  );
}
