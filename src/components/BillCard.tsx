import { Link } from 'react-router-dom';
import { Check, Receipt } from 'lucide-react';
import { markPaid } from '../db';
import type { DueBill } from '../lib/calc';
import { brl, date, dueText } from '../lib/format';
import { paths } from '../routes/paths';
import { LEVEL_BADGE, LEVEL_BORDER, LEVEL_LABEL, LEVEL_TEXT, btn, card } from '../ui';

/** Conta do mês mostrada como lembrete; "Pago" tira dos lembretes e ela entra no histórico. */
export default function BillCard({ uid, vid, bill, className = '' }: { uid: string; vid: string; bill: DueBill; className?: string }) {
  const { e, s } = bill;
  const series = e.series ? ` ${e.series.index}/${e.series.count}` : '';
  return (
    <div className={`${card} flex flex-col gap-1 border-l-4 ${LEVEL_BORDER[s.level]} ${className}`}>
      <Link to={paths.entry(vid, e.id)} className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_BADGE[s.level]}`}>
            {s.level === 'ok' ? 'Conta do mês' : LEVEL_LABEL[s.level]}
          </span>
          <Receipt className="size-4 text-expense" />
        </span>
        <span className="mt-1 flex items-baseline justify-between gap-2">
          <strong className="truncate">
            {e.category}
            {series}
          </strong>
          <strong className="whitespace-nowrap">{brl(e.amount)}</strong>
        </span>
        <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{dueText(s).replace('faltam', 'vence em')}</span>
      </Link>
      <span className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className={`text-xs ${s.level === 'overdue' ? 'font-semibold text-danger' : 'text-muted'}`}>vence {date(e.date)}</span>
        <button type="button" className={`${btn('primary', 'sm')} gap-1`} onClick={() => markPaid(uid, vid, e.id)}>
          <Check className="size-4" />
          Pago
        </button>
      </span>
    </div>
  );
}
