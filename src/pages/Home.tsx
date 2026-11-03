import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Car, CheckCircle2, Gauge, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import EntryRow from '../components/EntryRow';
import FlagStripe from '../components/FlagStripe';
import InstallCard from '../components/InstallCard';
import StatusStrip from '../components/StatusStrip';
import VehicleSwitcher from '../components/VehicleSwitcher';
import { syncVehicleOdometer } from '../db';
import { useGarage } from '../garage';
import { fuelStats, type AlertWindow, type DueReminder, type ReminderLevel } from '../lib/calc';
import { diffDays, fromTimestamp, today } from '../lib/dates';
import { brl, date, daysAgo, dueIn, dueText, km, num } from '../lib/format';
import {
  aVencer,
  gastoPagoNoAno,
  gastoPrevistoNoAno,
  isPaid,
  manutencoesNoAviso,
  proximaAcao,
  variacaoConsumo,
  type AVencerItem,
} from '../lib/summary';
import { monthsLabel } from './ReminderSettings';
import { paths } from '../routes/paths';
import type { Entry, Vehicle } from '../types';
import logoUrl from '../assets/logo.png';
import {
  badge,
  btn,
  card,
  iconCircle,
  KIND_ICON,
  KIND_SOFT,
  LEVEL_LABEL,
  LEVEL_TEXT,
  main,
  REMINDER_ICON,
  REMINDER_SOFT,
  sectionTitle,
  splash,
} from '../ui';

export default function Home() {
  const g = useGarage();
  if (g.loading) return <div className={splash}>Carregando…</div>;
  if (!g.vehicle) return <NoVehicle />;
  return <Summary key={g.vehicle.id} g={g} v={g.vehicle} />;
}

function NoVehicle() {
  return (
    <>
      <Header title="Unitali Garage" logo />
      <main className={`${main} flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-center`}>
        <span className="grid size-20 place-items-center rounded-full bg-brand-soft text-brand">
          <Car className="size-10" aria-hidden />
        </span>
        <h2 className="text-xl font-bold">Nenhum veículo ainda</h2>
        <p className="max-w-xs text-muted">Cadastre seu carro, moto ou bike para acompanhar abastecimentos, serviços e lembretes.</p>
        <Link className={`${btn('primary')} mt-2 gap-2`} to={paths.newVehicle()}>
          <Plus className="size-5" aria-hidden />
          Cadastrar veículo
        </Link>
        <InstallCard className="mt-8 w-full text-left" />
      </main>
    </>
  );
}

type Garage = ReturnType<typeof useGarage>;

/** Tela inicial (resumo do veículo selecionado). */
function Summary({ g, v }: { g: Garage; v: Vehicle }) {
  const { uid, vehicles, entries, reminders, current, rate, alert, due } = g;
  const ref = today();

  // mantém o km do veículo em dia (inclusive após editar/excluir registros)
  useEffect(() => {
    if (v.odometer !== current) syncVehicleOdometer(uid, v.id, current);
  }, [v, uid, current]);

  // cards: lembretes dentro da antecedência de aviso; sem nenhum, o mais próximo aparece como "em dia"
  const cards = useMemo(() => manutencoesNoAviso(due), [due]);
  const next = useMemo(() => proximaAcao(reminders, current, ref, rate, alert), [reminders, current, ref, rate, alert]);
  const upcoming = useMemo(() => aVencer(entries, due, ref, 3, cards.map((c) => c.r.id)), [entries, due, ref, cards]);
  const recent = useMemo(
    () => entries.filter((e) => isPaid(e, ref)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 3),
    [entries, ref],
  );
  const consumption = useMemo(() => fuelStats(entries), [entries]);
  const variation = useMemo(() => variacaoConsumo(entries, ref), [entries, ref]);
  const pago = gastoPagoNoAno(entries, ref);
  const previsto = gastoPrevistoNoAno(entries, ref);
  const unit = v.type === 'bike' ? 'km/kWh' : 'km/l';

  return (
    <>
      <header className="bg-bar px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-4 text-bar-ink">
        <div className="flex items-center gap-3">
          {/* fundo branco: o U azul-marinho sumiria na barra da mesma cor */}
          <img src={logoUrl} alt="Unitali Garage" className="size-10 shrink-0 rounded-xl bg-white object-contain p-1" />
          <VehicleSwitcher vehicles={vehicles} current={v} odometer={current} />
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm opacity-85">Hodômetro · {odometerAge(v, entries, ref)}</p>
            <p className="text-[28px] leading-tight font-bold">{km(current)}</p>
          </div>
          <Link to={paths.odometer(v.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-bar">
            <Gauge className="size-5" aria-hidden />
            Atualizar km
          </Link>
        </div>
      </header>
      <FlagStripe className="h-1" />
      <StatusStrip />

      <main className={`${main} flex flex-col gap-3`}>
        <Maintenance vid={v.id} cards={cards} next={next} alert={alert} />

        <section className="grid grid-cols-2 gap-3">
          <div className={card}>
            <h2 className="text-sm text-muted">Gasto em {ref.slice(0, 4)}</h2>
            <p className="text-xl font-bold">{brl(pago)}</p>
            <p className="text-xs text-muted">{previsto > 0 ? `pago · ${brl(previsto)} previsto` : 'pago'}</p>
          </div>
          <div className={card}>
            <h2 className="text-sm text-muted">Consumo médio</h2>
            <p className="text-xl font-bold">{consumption.avg ? `${num(consumption.avg, 1)} ${unit}` : '—'}</p>
            {variation != null ? (
              <p className={`flex items-center gap-1 text-xs ${variation >= 0 ? 'text-ok' : 'text-muted'}`}>
                {variation >= 0 ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
                {variation >= 0 ? '+' : ''}
                {num(variation * 100, 0)}% vs. mês anterior
              </p>
            ) : (
              <p className="text-xs text-muted">{consumption.avg ? 'média de todos os tanques' : 'precisa de 2 tanques cheios'}</p>
            )}
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className={card}>
            <SectionHead title="A vencer" to={paths.reminders()} link="Ver todos" />
            <ul className="divide-y divide-line">
              {upcoming.map((item) => (
                <UpcomingRow key={item.type === 'bill' ? item.entry.id : item.due.r.id} vid={v.id} item={item} urgentDays={alert.urgentDays} />
              ))}
            </ul>
          </section>
        )}

        <section className={card}>
          <SectionHead title="Últimos registros" to={paths.history()} link="Histórico" />
          {recent.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nada registrado ainda. Toque em + para começar.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((e) => (
                <li key={e.id}>
                  <EntryRow vid={v.id} entry={e} kml={consumption.byEntry[e.id]} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <InstallCard />
      </main>
    </>
  );
}

/** "atualizado há X dias": o mais recente entre o "Atualizar km" e os registros com km. */
function odometerAge(v: Vehicle, entries: Entry[], ref: string) {
  const dates = entries.filter((e) => e.odometer != null && e.date <= ref).map((e) => e.date);
  if (v.odometerUpdatedAt) dates.push(fromTimestamp(v.odometerUpdatedAt));
  if (dates.length === 0) return 'informe o km atual';
  const last = dates.sort()[dates.length - 1];
  return `atualizado ${daysAgo(diffDays(last, ref))}`;
}

function SectionHead({ title, to, link }: { title: string; to: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className={sectionTitle}>{title}</h2>
      <Link className="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand" to={to}>
        {link}
      </Link>
    </div>
  );
}

/** Cores dos cards de manutenção: verde em dia, laranja urgente, vermelho vencido (Configurações → Lembretes). */
const TONE: Record<ReminderLevel, { box: string; text: string; badge: string; button: string }> = {
  overdue: { box: 'border-danger/30 bg-danger-bg', text: 'text-danger', badge: 'bg-danger text-bg', button: 'bg-danger text-bg' },
  soon: { box: 'border-warn-border bg-warn-bg', text: 'text-warn', badge: 'bg-warn text-bg', button: 'bg-warn text-bg' },
  ok: { box: 'border-ok/30 bg-ok-bg', text: 'text-ok', badge: 'bg-ok text-bg', button: 'bg-ok text-bg' },
};

/**
 * Próxima manutenção: um card por lembrete dentro da antecedência de aviso, do mais urgente,
 * com rolagem lateral quando há mais de um. Sem nenhum na janela, mostra o mais próximo como "em dia".
 */
function Maintenance({ vid, cards, next, alert }: { vid: string; cards: DueReminder[]; next: DueReminder | null; alert: AlertWindow }) {
  if (!next)
    return (
      <section className={`${card} flex flex-wrap items-center gap-3`}>
        <span className={`${iconCircle} ${REMINDER_SOFT}`}>
          <REMINDER_ICON className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Crie seu primeiro lembrete</h2>
          <p className="text-sm text-muted">Troca de óleo, revisão, IPVA… avisamos antes de vencer.</p>
        </div>
        <Link to={paths.newReminder(vid)} className={btn('primary', 'sm')}>
          Criar lembrete
        </Link>
      </section>
    );

  if (cards.length === 0)
    return (
      <Link to={paths.reminders()} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${TONE.ok.box}`}>
        <CheckCircle2 className="size-6 shrink-0 text-ok" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong>Manutenção em dia</strong>
          <span className="text-sm text-muted">
            Nada vence nos próximos {km(alert.km)} ou {monthsLabel(alert.months)}. Próxima: {next.r.title}
            {dueText(next.s) ? ` (${dueText(next.s)})` : ''}.
          </span>
        </span>
      </Link>
    );

  return (
    <section>
      <SectionHead title="Próxima manutenção" to={paths.reminders()} link="Ver todos" />
      {cards.length === 1 ? (
        <MaintenanceCard vid={vid} item={cards[0]} />
      ) : (
        // -mx-4/px-4: os cards encostam na borda da tela ao rolar, mas começam alinhados ao conteúdo
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {cards.map((d) => (
            <MaintenanceCard key={d.r.id} vid={vid} item={d} className="w-[85%] max-w-sm shrink-0 snap-start" />
          ))}
        </div>
      )}
    </section>
  );
}

/** Card de um lembrete, na cor do nível, com atalho para registrar o serviço já com ele selecionado. */
function MaintenanceCard({ vid, item, className = '' }: { vid: string; item: DueReminder; className?: string }) {
  const { r, s, due, estimated } = item;
  const tone = TONE[s.level];
  const when = [due ? `${estimated ? '≈ ' : ''}${date(due)}` : null, s.nextKm != null ? km(s.nextKm) : null].filter(Boolean).join(' · ');
  const ServiceIcon = KIND_ICON.service;

  return (
    <article className={`flex flex-col rounded-2xl border p-3.5 ${tone.box} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`${iconCircle} bg-surface ${tone.text}`}>
          <ServiceIcon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className={`${badge} ${tone.badge}`}>{LEVEL_LABEL[s.level]}</span>
          <h3 className="text-lg font-bold break-words">
            <Link to={paths.reminder(vid, r.id)}>{r.title}</Link>
          </h3>
          <p className={`text-sm font-semibold ${tone.text}`}>{dueText(s)}</p>
          {when && <p className="text-sm text-muted">vence {when}</p>}
        </div>
      </div>
      {/* mt-auto: no carrossel os botões ficam alinhados embaixo mesmo com textos de tamanhos diferentes */}
      <div className="mt-auto pt-3">
        <Link
          to={paths.newEntry(vid, 'service', { lembrete: r.id })}
          className={`inline-flex min-h-11 items-center rounded-xl px-4 font-semibold ${tone.button}`}
        >
          Registrar serviço
        </Link>
      </div>
    </article>
  );
}

/** Item de "A vencer": parcela/conta em aberto ou lembrete. */
function UpcomingRow({ vid, item, urgentDays }: { vid: string; item: AVencerItem; urgentDays: number }) {
  if (item.type === 'bill') {
    const e = item.entry;
    const days = diffDays(today(), e.date);
    const level: ReminderLevel = days < 0 ? 'overdue' : days <= urgentDays ? 'soon' : 'ok';
    const ExpenseIcon = KIND_ICON.expense;
    return (
      <li>
        <Link to={paths.entry(vid, e.id)} className="flex min-h-11 items-start gap-3 py-3">
          <span className={`${iconCircle} ${KIND_SOFT.expense}`}>
            <ExpenseIcon className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="break-words">
              {e.category}
              {e.series ? ` · ${e.series.type === 'installments' ? 'parcela ' : ''}${e.series.index} de ${e.series.count}` : ''}
            </strong>
            <span className={`text-sm ${LEVEL_TEXT[level]}`}>
              vence {date(e.date)} · {dueIn(days)}
            </span>
          </span>
          <strong className="shrink-0 whitespace-nowrap">{brl(e.amount)}</strong>
        </Link>
      </li>
    );
  }
  const { r, s, due, estimated } = item.due;
  const text =
    s.kmLeft != null
      ? s.kmLeft > 0
        ? `faltam ${km(s.kmLeft)}`
        : `passou ${km(-s.kmLeft)}`
      : due
        ? `${estimated ? '≈ ' : ''}${date(due)}${s.daysLeft != null ? ` · ${dueIn(s.daysLeft)}` : ''}`
        : '';
  return (
    <li>
      <Link to={paths.reminder(vid, r.id)} className="flex min-h-11 items-start gap-3 py-3">
        <span className={`${iconCircle} ${REMINDER_SOFT}`}>
          <REMINDER_ICON className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="break-words">{r.title}</strong>
          <span className={`text-sm ${LEVEL_TEXT[s.level]}`}>{text}</span>
        </span>
      </Link>
    </li>
  );
}
