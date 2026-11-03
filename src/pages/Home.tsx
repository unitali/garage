import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Car, Gauge, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import EntryRow from '../components/EntryRow';
import FlagStripe from '../components/FlagStripe';
import InstallCard from '../components/InstallCard';
import StatusStrip from '../components/StatusStrip';
import VehicleSwitcher from '../components/VehicleSwitcher';
import { syncVehicleOdometer } from '../db';
import { useGarage } from '../garage';
import { fuelStats, type DueReminder, type ReminderLevel } from '../lib/calc';
import { addMonths, diffDays, fromTimestamp, today } from '../lib/dates';
import { brl, date, daysAgo, dueIn, km, num } from '../lib/format';
import { aVencer, gastoPagoNoAno, gastoPrevistoNoAno, isPaid, proximaAcao, variacaoConsumo, type AVencerItem } from '../lib/summary';
import { paths } from '../routes/paths';
import type { Entry, Vehicle } from '../types';
import logoUrl from '../assets/logo.png';
import {
  btn,
  card,
  iconCircle,
  KIND_ICON,
  KIND_SOFT,
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
  // até quando uma conta fica "em breve" (âmbar): a mesma janela dos lembretes
  const soonUntil = addMonths(ref, alert.months);

  // mantém o km do veículo em dia (inclusive após editar/excluir registros)
  useEffect(() => {
    if (v.odometer !== current) syncVehicleOdometer(uid, v.id, current);
  }, [v, uid, current]);

  const next = useMemo(() => proximaAcao(reminders, current, ref, rate, alert), [reminders, current, ref, rate, alert]);
  const upcoming = useMemo(() => aVencer(entries, due, ref, 3, next?.r.id), [entries, due, ref, next]);
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
        <NextMaintenance vid={v.id} next={next} />

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
                <UpcomingRow key={item.type === 'bill' ? item.entry.id : item.due.r.id} vid={v.id} item={item} soonUntil={soonUntil} />
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

const NEXT_TONE: Record<ReminderLevel, { box: string; label: string; button: string }> = {
  overdue: { box: 'border-danger/30 bg-danger-bg', label: 'text-danger', button: 'bg-danger text-bg' },
  soon: { box: 'border-warn-border bg-warn-bg', label: 'text-warn', button: 'bg-warn text-bg' },
  ok: { box: 'border-line bg-surface', label: 'text-muted', button: 'bg-brand text-brand-contrast' },
};

/** Lembrete mais urgente, com atalho para registrar o serviço já com ele selecionado. */
function NextMaintenance({ vid, next }: { vid: string; next: DueReminder | null }) {
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

  const { r, s, due, estimated } = next;
  const tone = NEXT_TONE[s.level];
  const kmPart = s.kmLeft != null ? (s.kmLeft > 0 ? `em ${km(s.kmLeft)}` : `passou ${km(-s.kmLeft)}`) : null;
  const when = s.nextDate ? `até ${date(s.nextDate)}` : due ? `${estimated ? '≈ ' : ''}${date(due)}` : null;
  const detail = [kmPart ? (when ? `ou ${when}` : null) : s.daysLeft != null ? dueIn(s.daysLeft) : when, r.lastKm != null ? `última em ${km(r.lastKm)}` : null]
    .filter(Boolean)
    .join(' · ');
  const ServiceIcon = KIND_ICON.service;

  return (
    <section className={`rounded-2xl border p-3.5 ${tone.box}`}>
      <div className="flex items-start gap-3">
        <span className={`${iconCircle} ${KIND_SOFT.service}`}>
          <ServiceIcon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold tracking-wide uppercase ${tone.label}`}>
            {s.level === 'overdue' ? 'Manutenção vencida' : 'Próxima manutenção'}
          </p>
          <h2 className="text-lg font-bold break-words">
            {r.title}
            {kmPart ? ` ${kmPart}` : ''}
          </h2>
          {detail && <p className="text-sm text-muted">{detail}</p>}
        </div>
      </div>
      <Link
        to={paths.newEntry(vid, 'service', { lembrete: r.id })}
        className={`mt-3 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold ${tone.button}`}
      >
        Registrar serviço
      </Link>
    </section>
  );
}

/** Item de "A vencer": parcela/conta em aberto ou lembrete. */
function UpcomingRow({ vid, item, soonUntil }: { vid: string; item: AVencerItem; soonUntil: string }) {
  if (item.type === 'bill') {
    const e = item.entry;
    const days = diffDays(today(), e.date);
    const level: ReminderLevel = days < 0 ? 'overdue' : e.date <= soonUntil ? 'soon' : 'ok';
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
