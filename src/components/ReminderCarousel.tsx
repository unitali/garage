import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import type { DueReminder } from '../lib/calc';
import { date, dueText, km } from '../lib/format';
import { LEVEL_BADGE, LEVEL_BORDER_TOP, LEVEL_LABEL, LEVEL_TEXT, card } from '../ui';
import { paths } from '../routes/paths';

/** Lembretes em cards com rolagem lateral, do que vence antes para o que vence depois. */
export default function ReminderCarousel({ vid, items }: { vid: string; items: DueReminder[] }) {
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
    </div>
  );
}
