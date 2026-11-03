import { Link } from 'react-router-dom';
import { Plus, Settings2 } from 'lucide-react';
import Header from '../components/Header';
import BillRow from '../components/BillRow';
import SeriesCard from '../components/SeriesCard';
import { markReminderDone } from '../db';
import { useGarage } from '../garage';
import { today } from '../lib/dates';
import { date, dueText, km } from '../lib/format';
import { isPaid, proximaAcao, seriesDe } from '../lib/summary';
import { paths } from '../routes/paths';
import { badge, btn, card, emptyText, iconCircle, LEVEL_BADGE, LEVEL_LABEL, LEVEL_TEXT, main, REMINDER_ICON, REMINDER_SOFT, splash } from '../ui';

const groupTitle = 'mb-2 px-1 text-xs font-bold tracking-wider text-muted uppercase';

/**
 * Lembretes (o que está por vir): contas dentro do aviso (com "Pago"), parcelados/recorrentes com parcelas
 * em aberto e lembretes de manutenção (com "Feito"), do mais urgente ao menos.
 */
export default function RemindersPage() {
  const { uid, vehicle, entries, reminders, current, rate, alert, due, bills, loading } = useGarage();
  if (loading) return <div className={splash}>Carregando…</div>;

  // o mais urgente (o mesmo do card "Próxima manutenção") primeiro; depois vencido > próximo > o resto
  const top = proximaAcao(reminders, current, today(), rate, alert);
  const rest = due.filter((d) => d.r.id !== top?.r.id).sort((a, b) => rank(a.s.level) - rank(b.s.level));
  const ordered = top ? [top, ...rest] : rest;
  // séries com alguma parcela ainda em aberto (as já quitadas só aparecem no Histórico)
  const openSeries = seriesDe(entries).filter((parcelas) => parcelas.some((e) => !isPaid(e)));

  return (
    <>
      <Header title="Lembretes" odometer={current} />
      <main className={`${main} flex flex-col gap-4`}>
        {!vehicle ? (
          <p className={emptyText}>Cadastre um veículo para criar lembretes.</p>
        ) : (
          <>
            {bills.length > 0 && (
              <section>
                <h2 className={groupTitle}>Contas</h2>
                <div className={`${card} divide-y divide-line py-0`}>
                  {bills.map((b) => (
                    <BillRow key={b.e.id} uid={uid} vid={vehicle.id} bill={b} />
                  ))}
                </div>
              </section>
            )}

            {openSeries.length > 0 && (
              <section>
                <h2 className={groupTitle}>Parcelados e recorrentes</h2>
                <div className="flex flex-col gap-3">
                  {openSeries.map((parcelas) => (
                    <SeriesCard key={parcelas[0].series!.id} uid={uid} vid={vehicle.id} parcelas={parcelas} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className={groupTitle}>Manutenção</h2>
              {ordered.length === 0 ? (
                <p className={`${card} text-sm text-muted`}>Nenhum lembrete. Crie por km e/ou por tempo — troca de óleo, revisão, IPVA…</p>
              ) : (
                <ul className={`${card} divide-y divide-line py-0`}>
                  {ordered.map(({ r, s, due: when, estimated }) => (
                    <li key={r.id} className="flex items-start gap-3 py-3">
                      <span className={`${iconCircle} ${REMINDER_SOFT}`}>
                        <REMINDER_ICON className="size-5" aria-hidden />
                      </span>
                      <Link to={paths.reminder(vehicle.id, r.id)} className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="break-words">{r.title}</strong>
                          {s.level !== 'ok' && <span className={`${badge} ${LEVEL_BADGE[s.level]}`}>{LEVEL_LABEL[s.level]}</span>}
                        </span>
                        <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{dueText(s)}</span>
                        <span className="text-xs text-muted">
                          Próximo:{' '}
                          {[s.nextKm != null ? km(s.nextKm) : null, when ? `${estimated ? '≈ ' : ''}${date(when)}` : null].filter(Boolean).join(' · ')}
                        </span>
                      </Link>
                      <button
                        className={`${btn('default', 'sm')} shrink-0`}
                        onClick={() => {
                          if (confirm(`Marcar "${r.title}" como feito hoje com ${km(current)}?`)) markReminderDone(uid, vehicle.id, r.id, current, today());
                        }}
                      >
                        Feito
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Link to={paths.newReminder(vehicle.id)} className={`${btn('primary')} w-full gap-2`}>
              <Plus className="size-5" aria-hidden />
              Novo lembrete
            </Link>
            <Link to={paths.reminderSettings()} className={`${btn()} w-full gap-2`}>
              <Settings2 className="size-5" aria-hidden />
              Avisar com antecedência
            </Link>
          </>
        )}
      </main>
    </>
  );
}

const rank = (level: string) => (level === 'overdue' ? 0 : level === 'soon' ? 1 : 2);
