import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { markPaid } from '../db';
import type { DueBill } from '../lib/calc';
import { brl, date, dueIn } from '../lib/format';
import { paths } from '../routes/paths';
import { btn, iconCircle, KIND_ICON, KIND_SOFT, LEVEL_TEXT } from '../ui';

const Icon = KIND_ICON.expense;

/** Conta do mês (dentro de um card com divisórias): "Pago" tira dos lembretes e ela vai para o histórico. */
export default function BillRow({ uid, vid, bill }: { uid: string; vid: string; bill: DueBill }) {
  const { e, s } = bill;
  const series = e.series ? ` · ${e.series.type === 'installments' ? 'parcela ' : ''}${e.series.index} de ${e.series.count}` : '';
  return (
    <div className="flex items-start gap-3 py-3">
      <span className={`${iconCircle} ${KIND_SOFT.expense}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link to={paths.entry(vid, e.id)} className="flex flex-col gap-0.5">
          <span className="flex items-start justify-between gap-3">
            <strong className="min-w-0 break-words">
              {e.category}
              {series}
            </strong>
            <strong className="shrink-0 whitespace-nowrap">{brl(e.amount)}</strong>
          </span>
          <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>
            vence {date(e.date)} · {dueIn(s.daysLeft ?? 0)}
          </span>
        </Link>
        {/* abaixo do texto: o título usa a largura toda */}
        <button type="button" className={`${btn('primary', 'sm')} mt-2 gap-1 self-start`} onClick={() => markPaid(uid, vid, e.id)}>
          <Check className="size-4" aria-hidden />
          Pago
        </button>
      </div>
    </div>
  );
}
