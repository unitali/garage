import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useUid } from '../auth';
import { savePrefs } from '../db';
import { useAlertWindow } from '../hooks';
import { ALERT_KM_OPTIONS, ALERT_MONTH_OPTIONS } from '../constants';
import type { AlertWindow } from '../lib/calc';
import { km } from '../lib/format';
import { paths } from '../routes/paths';
import { btn, card, chip, main, sectionTitle } from '../ui';

export const monthsLabel = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`;

/** Configurações → Lembretes: a partir de quando um lembrete fica "em breve" (âmbar). */
export default function ReminderSettings() {
  const uid = useUid();
  const saved = useAlertWindow(uid);
  const navigate = useNavigate();
  // rascunho local: os chips só mudam a tela; grava tudo de uma vez no Salvar
  const [draft, setDraft] = useState<AlertWindow | null>(null);
  const alert = draft ?? saved;
  const changed = (Object.keys(saved) as (keyof AlertWindow)[]).filter((k) => alert[k] !== saved[k]);

  function save() {
    const field = { km: 'alertKm', months: 'alertMonths' } as const;
    // uma escrita só, com os campos que mudaram
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
            O lembrete fica <b className="text-warn">em breve</b> (âmbar) e aparece em "A vencer" quando faltar menos que
            isso — o que acontecer primeiro.
          </p>

          <span className="text-sm font-semibold">Faltando até</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Antecedência em km">
            {ALERT_KM_OPTIONS.map((k) => (
              <button key={k} aria-pressed={alert.km === k} className={chip(alert.km === k)} onClick={() => setDraft({ ...alert, km: k })}>
                {km(k)}
              </button>
            ))}
          </div>

          <span className="text-sm font-semibold">ou até</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Antecedência em meses">
            {ALERT_MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                aria-pressed={alert.months === m}
                className={chip(alert.months === m)}
                onClick={() => setDraft({ ...alert, months: m })}
              >
                {monthsLabel(m)}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
            <li>
              <b className="text-danger">Vermelho</b> — venceu o km ou a data
            </li>
            <li>
              <b className="text-warn">Âmbar</b> — em breve: faltando até {km(alert.km)} ou {monthsLabel(alert.months)}
            </li>
            <li>
              <b>Neutro</b> — ainda falta mais que isso
            </li>
          </ul>
        </section>

        <button className={`${btn('primary')} w-full`} onClick={save} disabled={changed.length === 0}>
          Salvar
        </button>
      </main>
    </>
  );
}
