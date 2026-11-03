import { BellRing } from 'lucide-react';
import Header from '../components/Header';
import { useUid } from '../auth';
import { savePrefs } from '../db';
import { useAlertWindow } from '../hooks';
import { ALERT_KM_OPTIONS, ALERT_MONTH_OPTIONS } from '../constants';
import { km } from '../lib/format';
import { paths } from '../routes/paths';
import { card, chip, main, sectionTitle } from '../ui';

export const monthsLabel = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`;

/** Configurações → Lembretes: com quanta antecedência um lembrete aparece no topo do histórico. */
export default function ReminderSettings() {
  const uid = useUid();
  const alert = useAlertWindow(uid);

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
                onClick={() => savePrefs(uid, { alertKm: k })}
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
                onClick={() => savePrefs(uid, { alertMonths: m })}
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
      </main>
    </>
  );
}
