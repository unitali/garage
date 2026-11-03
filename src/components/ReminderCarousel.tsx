import { Link } from 'react-router-dom';
import { BellPlus, CalendarDays, Plus } from 'lucide-react';
import type { DueReminder } from '../lib/calc';
import { date, dueText, km } from '../lib/format';
import { LEVEL_BADGE, LEVEL_BORDER_TOP, LEVEL_LABEL, LEVEL_TEXT, card } from '../ui';
import { paths } from '../routes/paths';

/** Lembretes em cards com rolagem lateral, do que vence antes para o que vence depois. */
export default function ReminderCarousel({ vid, items }: { vid: string; items: DueReminder[] }) {
  if (items.length === 0)
    return (
      <Link
        to={paths.newReminder(vid)}
        className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-line p-4 text-left"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <BellPlus />
        </span>
        <span className="flex flex-col gap-0.5">
          <strong>Criar lembrete</strong>
          <span className="text-sm text-muted">Troca de óleo, IPVA, revisão, seguro… avisamos antes de vencer.</span>
        </span>
      </Link>
    );

  return (
    // -mx-4/px-4: os cards encostam na borda da tela ao rolar, mas começam alinhados ao conteúdo
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {items.map(({ r, s, due, estimated }) => (
        <Link
          key={r.id}
          to={paths.reminder(vid, r.id)}
          className={`${card} flex w-60 shrink-0 snap-start flex-col gap-1 border-t-4 ${LEVEL_BORDER_TOP[s.level]}`}
        >
          <span className={`self-start rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_BADGE[s.level]}`}>{LEVEL_LABEL[s.level]}</span>
          <strong className="mt-1 truncate">{r.title}</strong>
          <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{dueText(s)}</span>
          <span className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted">
            <CalendarDays className="size-3.5 shrink-0" />
            {due ? `${estimated ? '≈ ' : ''}${date(due)}` : 'sem data estimada'}
            {s.nextKm != null && ` · ${km(s.nextKm)}`}
          </span>
        </Link>
      ))}
      <Link
        to={paths.newReminder(vid)}
        className="flex w-36 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-muted"
      >
        <Plus />
        Novo lembrete
      </Link>
    </div>
  );
}
