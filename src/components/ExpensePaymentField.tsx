import { useEffect } from 'react';
import { buildSchedule, sumItems, type ScheduleMode } from '../lib/calc';
import { brl, maskMoney, parseDecimal, toInput } from '../lib/format';
import { chip, field, grid2, input } from '../ui';

export type PayMode = 'single' | ScheduleMode;

/** Parcela em edição: valor como texto da máscara. */
export interface ScheduleRow {
  key: number;
  date: string;
  amount: string;
}

const MODES: { id: PayMode; label: string }[] = [
  { id: 'single', label: 'Cota única' },
  { id: 'installments', label: 'Parcelado' },
  { id: 'recurring', label: 'Recorrente' },
];

/** Quantidade padrão ao escolher o modo. */
export const DEFAULT_COUNT: Record<ScheduleMode, number> = { installments: 2, recurring: 12 };
const COUNTS = Array.from({ length: 23 }, (_, i) => i + 2); // 2 … 24

export const rowsTotal = (rows: ScheduleRow[]) => sumItems(rows.map((r) => ({ amount: parseDecimal(r.amount) ?? 0 })));

let nextKey = 0;

/**
 * Forma de pagamento da despesa: cota única, parcelado (total dividido) ou recorrente (valor por mês).
 * Os vencimentos começam em `firstDate` e seguem mês a mês; data e valor de cada um são editáveis.
 */
export default function ExpensePaymentField({
  mode,
  onMode,
  amount,
  onAmount,
  count,
  onCount,
  rows,
  onRows,
  firstDate,
}: {
  mode: PayMode;
  onMode: (mode: PayMode) => void;
  amount: string;
  onAmount: (raw: string) => void;
  count: number;
  onCount: (count: number) => void;
  rows: ScheduleRow[];
  onRows: (rows: ScheduleRow[]) => void;
  firstDate: string;
}) {
  // recalcula os vencimentos quando muda o que os define (edições numa parcela não disparam)
  useEffect(() => {
    if (mode === 'single') return onRows([]);
    const value = parseDecimal(amount) ?? 0;
    onRows(
      buildSchedule(mode, firstDate, value, count).map((r) => ({
        key: ++nextKey,
        date: r.date,
        amount: r.amount ? toInput(r.amount, 2) : '',
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, firstDate, amount, count]);

  const update = (key: number, patch: Partial<ScheduleRow>) => onRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const total = rowsTotal(rows);
  const typedTotal = parseDecimal(amount) ?? 0;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Pagamento</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Forma de pagamento">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={chip(mode === m.id)} onClick={() => onMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'single' ? (
        <label className={field}>
          Valor (R$)
          <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" placeholder="0,00" />
        </label>
      ) : (
        <>
          <div className={grid2}>
            <label className={field}>
              {mode === 'installments' ? 'Valor total (R$)' : 'Valor por mês (R$)'}
              <input className={input} value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" placeholder="0,00" />
            </label>
            <label className={field}>
              {mode === 'installments' ? 'Parcelas' : 'Quantos meses'}
              <select className={input} value={count} onChange={(e) => onCount(Number(e.target.value))}>
                {COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {mode === 'installments' ? `${n}x` : `${n} meses`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-line p-3">
            <span className="text-sm font-bold">Vencimentos</span>
            <ul className="flex flex-col gap-2">
              {rows.map((r, idx) => (
                <li key={r.key} className="grid grid-cols-[2rem_minmax(0,1fr)_7.5rem] items-center gap-2">
                  <span className="text-sm font-semibold text-muted">{idx + 1}ª</span>
                  <input
                    className={input}
                    type="date"
                    value={r.date}
                    onChange={(e) => update(r.key, { date: e.target.value })}
                    aria-label={`Vencimento da parcela ${idx + 1}`}
                  />
                  <input
                    className={`${input} text-right`}
                    value={r.amount}
                    onChange={(e) => update(r.key, { amount: maskMoney(e.target.value) })}
                    inputMode="numeric"
                    placeholder="0,00"
                    aria-label={`Valor da parcela ${idx + 1}`}
                  />
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <span className="font-semibold">Total ({rows.length} {mode === 'installments' ? 'parcelas' : 'meses'})</span>
              <strong>{brl(total)}</strong>
            </div>
            {mode === 'installments' && typedTotal > 0 && Math.abs(total - typedTotal) >= 0.01 && (
              <small className="text-xs text-warn">A soma das parcelas difere do valor total informado ({brl(typedTotal)}).</small>
            )}
          </div>
        </>
      )}
    </>
  );
}
