import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import Header from '../components/Header';
import { useUid } from '../auth';
import { savePrefs } from '../db';
import { useAlertWindow } from '../hooks';
import { ALERT_KM_OPTIONS, ALERT_MONTH_OPTIONS, URGENT_DAY_OPTIONS, URGENT_KM_OPTIONS } from '../constants';
import { km } from '../lib/format';
import { paths } from '../routes/paths';
import { btn, card, chip, main, sectionTitle } from '../ui';
import type { AlertWindow } from '../lib/calc';

export const monthsLabel = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`;
const daysLabel = (d: number) => `${d} ${d === 1 ? 'dia' : 'dias'}`;

/** Configurações → Lembretes: quando um lembrete aparece no histórico e quando fica laranja. */
export default function ReminderSettings() {
  const uid = useUid();
  const saved = useAlertWindow(uid);
  // rascunho local: os badges só mudam a tela; grava tudo de uma vez no Salvar
  const [draft, setDraft] = useState<AlertWindow | null>(null);
  const navigate = useNavigate();
  const alert = draft ?? saved;
  const changed = (Object.keys(saved) as (keyof AlertWindow)[]).filter((k) => alert[k] !== saved[k]);

  function set(patch: Partial<AlertWindow>) {
    setDraft({ ...alert, ...patch });
  }

  function save() {
    // uma escrita só, com os campos que mudaram
    const field: Record<keyof AlertWindow, 'alertKm' | 'alertMonths' | 'urgentKm' | 'urgentDays'> = {
      km: 'alertKm',
      months: 'alertMonths',
      urgentKm: 'urgentKm',
      urgentDays: 'urgentDays',
    };
    savePrefs(uid, Object.fromEntries(changed.map((k) => [field[k], alert[k]])));
    navigate(paths.home());
  }

  return (
    <>
      <Header title="Lembretes" back={paths.settings()} />
      <main className={`${main} flex flex-col gap-4`}>
        <section className={`${card} flex flex-col gap-3`}>
          <h2 className={sectionTitle}>Avisar com antecedência</h2>
          <p className="text-sm text-muted">
            O lembrete aparece no topo do histórico (e fica "em breve") quando faltar menos que isso — o que acontecer
            primeiro.
          </p>

          <span className="text-sm font-semibold">Faltando até</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Antecedência em km">
            {ALERT_KM_OPTIONS.map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={alert.km === k}
                className={chip(alert.km === k)}
                onClick={() => set({ km: k })}
              >
                {km(k)}
              </button>
            ))}
          </div>

          <span className="text-sm font-semibold">ou até</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Antecedência em meses">
            {ALERT_MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={alert.months === m}
                className={chip(alert.months === m)}
                onClick={() => set({ months: m })}
              >
                {monthsLabel(m)}
              </button>
            ))}
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-brand-soft p-2.5 text-sm">
            <BellRing className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              Avisa faltando <b>{km(alert.km)}</b> ou <b>{monthsLabel(alert.months)}</b> para a próxima troca. Vencidos
              aparecem sempre.
            </span>
          </p>
        </section>

        <section className={`${card} flex flex-col gap-3`}>
          <h2 className={sectionTitle}>Cores do card</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            <Legend color="bg-ok" label="Verde" text="em dia" />
            <Legend color="bg-warn" label="Laranja" text={`urgente: faltando até ${km(alert.urgentKm)} ou ${daysLabel(alert.urgentDays)}`} />
            <Legend color="bg-danger" label="Vermelho" text="venceu o km ou a data (data e km também em vermelho)" />
          </ul>

          <span className="text-sm font-semibold">Laranja faltando até</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Urgente em km">
            {URGENT_KM_OPTIONS.map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={alert.urgentKm === k}
                className={chip(alert.urgentKm === k)}
                onClick={() => set({ urgentKm: k })}
              >
                {km(k)}
              </button>
            ))}
          </div>

          <span className="text-sm font-semibold">ou até</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Urgente em dias">
            {URGENT_DAY_OPTIONS.map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={alert.urgentDays === d}
                className={chip(alert.urgentDays === d)}
                onClick={() => set({ urgentDays: d })}
              >
                {daysLabel(d)}
              </button>
            ))}
          </div>
        </section>

        <button className={`${btn('primary')} w-full`} onClick={save} disabled={changed.length === 0}>
          Salvar
        </button>
      </main>
    </>
  );
}

function Legend({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`h-5 w-1.5 shrink-0 rounded-full ${color}`} />
      <span>
        <b>{label}</b> — {text}
      </span>
    </li>
  );
}
