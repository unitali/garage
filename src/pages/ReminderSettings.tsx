import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useUid } from '../auth';
import { savePrefs } from '../db';
import { useAlertWindow } from '../hooks';
import { ALERT_KM_OPTIONS, ALERT_MONTH_OPTIONS, URGENT_DAY_OPTIONS, URGENT_KM_OPTIONS } from '../constants';
import type { AlertWindow } from '../lib/calc';
import { daysLabel, km, monthsLabel } from '../lib/format';
import { paths } from '../routes/paths';
import type { UserPrefs } from '../types';
import { btn, card, chip, main, sectionTitle } from '../ui';


const FIELD: Record<keyof AlertWindow, keyof UserPrefs> = {
  km: 'alertKm',
  months: 'alertMonths',
  urgentKm: 'urgentKm',
  urgentDays: 'urgentDays',
};

/** Configurações → Lembretes: quando o card aparece na tela inicial (verde) e quando fica amarelo. */
export default function ReminderSettings() {
  const uid = useUid();
  const saved = useAlertWindow(uid);
  const navigate = useNavigate();
  // rascunho local: os chips só mudam a tela; grava tudo de uma vez no Salvar
  const [draft, setDraft] = useState<AlertWindow | null>(null);
  const alert = draft ?? saved;
  const changed = (Object.keys(saved) as (keyof AlertWindow)[]).filter((k) => alert[k] !== saved[k]);

  function save() {
    // uma escrita só, com os campos que mudaram
    savePrefs(uid, Object.fromEntries(changed.map((k) => [FIELD[k], alert[k]])));
    navigate(paths.home());
  }

  return (
    <>
      <Header title="Lembretes" back={paths.more()} />
      <main className={`${main} flex flex-col gap-4`}>
        <section className={`${card} flex flex-col gap-3`}>
          <h2 className={sectionTitle}>Avisar com antecedência</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            O lembrete aparece em card na tela inicial quando faltar menos que isso — o que acontecer primeiro.
            Vencidos aparecem sempre.
          </p>
          <Chips label="Faltando até" options={ALERT_KM_OPTIONS} value={alert.km} format={km} onChange={(v) => setDraft({ ...alert, km: v })} />
          <Chips
            label="ou até"
            options={ALERT_MONTH_OPTIONS}
            value={alert.months}
            format={monthsLabel}
            onChange={(v) => setDraft({ ...alert, months: v })}
          />
        </section>

        <section className={`${card} flex flex-col gap-3`}>
          <h2 className={sectionTitle}>Cores do card</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            <Legend color="bg-emerald-700 dark:bg-emerald-400" label="Verde" text={`em dia: faltando até ${km(alert.km)} ou ${monthsLabel(alert.months)}`} />
            <Legend color="bg-amber-400" label="Amarelo" text={`próximo: faltando até ${km(alert.urgentKm)} ou ${daysLabel(alert.urgentDays)}`} />
            <Legend color="bg-red-700 dark:bg-red-400" label="Vermelho" text="vencido: passou do km ou da data" />
          </ul>
          <Chips
            label="Amarelo faltando até"
            options={URGENT_KM_OPTIONS}
            value={alert.urgentKm}
            format={km}
            onChange={(v) => setDraft({ ...alert, urgentKm: v })}
          />
          <Chips
            label="ou até"
            options={URGENT_DAY_OPTIONS}
            value={alert.urgentDays}
            format={daysLabel}
            onChange={(v) => setDraft({ ...alert, urgentDays: v })}
          />
        </section>

        <button className={`${btn('primary')} w-full`} onClick={save} disabled={changed.length === 0}>
          Salvar
        </button>
      </main>
    </>
  );
}

function Chips({
  label,
  options,
  value,
  format,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <>
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o} aria-pressed={value === o} className={chip(value === o)} onClick={() => onChange(o)}>
            {format(o)}
          </button>
        ))}
      </div>
    </>
  );
}

function Legend({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`size-3 shrink-0 rounded-full ${color}`} aria-hidden />
      <span>
        <b>{label}</b> — {text}
      </span>
    </li>
  );
}
