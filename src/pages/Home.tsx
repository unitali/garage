import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Car, Check, CheckCircle2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Carousel from '../components/Carousel';
import EntryRow from '../components/EntryRow';
import InstallCard from '../components/InstallCard';
import { markPaid, syncVehicleOdometer } from '../db';
import { useGarage } from '../garage';
import { fuelStats, type AlertWindow, type DueBill, type DueReminder, type ReminderLevel } from '../lib/calc';
import { today } from '../lib/dates';
import { brl, date, dueIn, dueText, km, num } from '../lib/format';
import {
  cardsDoInicio,
  gastoPagoNoAno,
  gastoPrevistoNoAno,
  isPaid,
  proximaAcao,
  tituloConta,
  variacaoConsumo,
  type CardItem,
} from '../lib/summary';
import { monthsLabel } from './ReminderSettings';
import { paths } from '../routes/paths';
import type { Vehicle } from '../types';
import {
  badge,
  btn,
  card,
  iconCircle,
  KIND_ICON,
  LEVEL_LABEL,
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
      <Header title="Início" />
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
  const { uid, entries, reminders, current, rate, alert, due, bills } = g;
  const ref = today();

  // mantém o km do veículo em dia (inclusive após editar/excluir registros)
  useEffect(() => {
    if (v.odometer !== current) syncVehicleOdometer(uid, v.id, current);
  }, [v, uid, current]);

  // cards: lembretes e contas dentro da antecedência de aviso; sem nenhum, o lembrete mais próximo aparece como "em dia"
  const cards = useMemo(() => cardsDoInicio(due, bills), [due, bills]);
  const next = useMemo(() => proximaAcao(reminders, current, ref, rate, alert), [reminders, current, ref, rate, alert]);
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
      <Header title="Início" odometer={current} />

      <main className={`${main} flex flex-col gap-3`}>
        <Upcoming uid={uid} vid={v.id} cards={cards} next={next} alert={alert} />

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

function SectionHead({ title, count, to, link }: { title: string; count?: number; to: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className={`${sectionTitle} flex items-center gap-2`}>
        {title}
        {count != null && <span className={`${badge} bg-brand text-brand-contrast`}>{count}</span>}
      </h2>
      <Link className="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand" to={to}>
        {link}
      </Link>
    </div>
  );
}

/** Cores dos cards: verde em dia, laranja próximo, vermelho vencido (Configurações → Lembretes). */
const TONE: Record<ReminderLevel, { box: string; text: string; badge: string; button: string }> = {
  overdue: { box: 'border-danger/30 bg-danger-bg', text: 'text-danger', badge: 'bg-danger text-bg', button: 'bg-danger text-bg' },
  soon: { box: 'border-warn-border bg-warn-bg', text: 'text-warn', badge: 'bg-warn text-bg', button: 'bg-warn text-bg' },
  ok: { box: 'border-ok/30 bg-ok-bg', text: 'text-ok', badge: 'bg-ok text-bg', button: 'bg-ok text-bg' },
};

/**
 * Lembretes e contas dentro da antecedência de aviso, um card cada, do mais urgente, com rolagem
 * lateral quando há mais de um. Sem nenhum na janela, mostra o lembrete mais próximo como "em dia".
 */
function Upcoming({
  uid,
  vid,
  cards,
  next,
  alert,
}: {
  uid: string;
  vid: string;
  cards: CardItem[];
  next: DueReminder | null;
  alert: AlertWindow;
}) {
  if (cards.length === 0 && !next)
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

  if (cards.length === 0 && next)
    return (
      <Link to={paths.reminders()} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${TONE.ok.box}`}>
        <CheckCircle2 className="size-6 shrink-0 text-ok" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong>Tudo em dia</strong>
          <span className="text-sm text-muted">
            Nada vence nos próximos {km(alert.km)} ou {monthsLabel(alert.months)}. Próximo: {next.r.title}
            {dueText(next.s) ? ` (${dueText(next.s)})` : ''}.
          </span>
        </span>
      </Link>
    );

  const render = (c: CardItem, className?: string) =>
    c.type === 'bill' ? (
      <BillCard key={c.bill.e.id} uid={uid} vid={vid} bill={c.bill} className={className} />
    ) : (
      <ReminderCard key={c.due.r.id} vid={vid} item={c.due} className={className} />
    );

  return (
    <section>
      <SectionHead title="Lembretes" count={cards.length > 1 ? cards.length : undefined} to={paths.reminders()} link="Ver todos" />
      {cards.length === 1 ? (
        render(cards[0])
      ) : (
        <Carousel label="Lembretes">{cards.map((c) => render(c, 'w-[85%] max-w-sm shrink-0 snap-start'))}</Carousel>
      )}
    </section>
  );
}

/** Moldura comum: fundo/borda na cor do nível, ícone, selo, título, prazo colorido e a ação embaixo. */
function ToneCard({
  level,
  icon: Icon,
  title,
  status,
  detail,
  action,
  className = '',
}: {
  level: ReminderLevel;
  icon: typeof Check;
  title: ReactNode;
  status: string;
  detail: string;
  action: ReactNode;
  className?: string;
}) {
  const tone = TONE[level];
  return (
    <article className={`flex flex-col rounded-2xl border p-3.5 ${tone.box} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`${iconCircle} bg-surface ${tone.text}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className={`${badge} ${tone.badge}`}>{LEVEL_LABEL[level]}</span>
          <h3 className="text-lg font-bold break-words">{title}</h3>
          <p className={`text-sm font-semibold ${tone.text}`}>{status}</p>
          {detail && <p className="text-sm text-muted">{detail}</p>}
        </div>
      </div>
      {/* mt-auto: no carrossel as ações ficam alinhadas embaixo mesmo com textos de tamanhos diferentes */}
      <div className="mt-auto pt-3">{action}</div>
    </article>
  );
}

const action = (level: ReminderLevel) => `inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 font-semibold ${TONE[level].button}`;

/** Lembrete: atalho para registrar o serviço já com ele selecionado. */
function ReminderCard({ vid, item, className }: { vid: string; item: DueReminder; className?: string }) {
  const { r, s, due, estimated } = item;
  const when = [due ? `${estimated ? '≈ ' : ''}${date(due)}` : null, s.nextKm != null ? km(s.nextKm) : null].filter(Boolean).join(' · ');
  return (
    <ToneCard
      level={s.level}
      icon={KIND_ICON.service}
      title={<Link to={paths.reminder(vid, r.id)}>{r.title}</Link>}
      status={dueText(s)}
      detail={when ? `vence ${when}` : ''}
      className={className}
      action={
        <Link to={paths.newEntry(vid, 'service', { lembrete: r.id })} className={action(s.level)}>
          Registrar serviço
        </Link>
      }
    />
  );
}

/** Conta em aberto (parcela, recorrente ou despesa futura): "Pago" tira dos lembretes e ela vai para o histórico. */
function BillCard({ uid, vid, bill, className }: { uid: string; vid: string; bill: DueBill; className?: string }) {
  const { e, s } = bill;
  return (
    <ToneCard
      level={s.level}
      icon={KIND_ICON.expense}
      title={
        <Link to={paths.entry(vid, e.id)}>{tituloConta(e)}</Link>
      }
      status={dueIn(s.daysLeft ?? 0)}
      detail={`vence ${date(e.date)} · ${brl(e.amount)}`}
      className={className}
      action={
        <button type="button" className={action(s.level)} onClick={() => markPaid(uid, vid, e.id)}>
          <Check className="size-4" aria-hidden />
          Pago
        </button>
      }
    />
  );
}
