import { Plus, Trash2 } from 'lucide-react';
import CategorySelect from './CategorySelect';
import { brl, maskMoney, parseDecimal } from '../lib/format';
import { sumItems } from '../lib/calc';
import { field, fieldset, input, legend } from '../ui';

/** Item em edição: valor como texto da máscara ("1.234,56"). */
export interface ItemDraft {
  key: number;
  category: string;
  amount: string;
}

let nextKey = 0;
export const newItem = (category = '', amount = ''): ItemDraft => ({ key: ++nextKey, category, amount });

export const draftsTotal = (items: ItemDraft[]) => sumItems(items.map((i) => ({ amount: parseDecimal(i.amount) ?? 0 })));

/** Lista do que foi feito no serviço (categoria + valor de cada item) e o total somado. */
export default function ServiceItemsField({
  uid,
  items,
  onChange,
}: {
  uid: string;
  items: ItemDraft[];
  onChange: (items: ItemDraft[]) => void;
}) {
  const update = (key: number, patch: Partial<ItemDraft>) => onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  return (
    <fieldset className={fieldset}>
      <legend className={legend}>O que foi feito</legend>
      <ul className="flex flex-col divide-y divide-line">
        {items.map((item, idx) => (
          <li key={item.key} className="flex flex-col gap-2 py-3 first:pt-1">
            <CategorySelect
              uid={uid}
              kind="service"
              label={items.length > 1 ? `Item ${idx + 1}` : 'Serviço'}
              value={item.category}
              onChange={(category) => update(item.key, { category })}
            />
            <div className="flex items-end gap-2">
              <label className={`${field} flex-1`}>
                Valor (R$)
                <input
                  className={input}
                  value={item.amount}
                  onChange={(e) => update(item.key, { amount: maskMoney(e.target.value) })}
                  inputMode="numeric"
                  placeholder="0,00"
                />
              </label>
              {items.length > 1 && (
                <button
                  type="button"
                  className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-line text-danger"
                  aria-label={`Remover item ${idx + 1}`}
                  onClick={() => onChange(items.filter((i) => i.key !== item.key))}
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-2.5 text-sm font-semibold text-brand"
        onClick={() => onChange([...items, newItem()])}
      >
        <Plus className="size-4" />
        Adicionar item
      </button>

      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-semibold">Total{items.length > 1 ? ` (${items.length} itens)` : ''}</span>
        <strong className="text-lg">{brl(draftsTotal(items))}</strong>
      </div>
    </fieldset>
  );
}
