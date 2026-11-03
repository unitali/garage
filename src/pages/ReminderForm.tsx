import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useUid } from '../auth';
import { useEntries, useReminders, useVehicle } from '../hooks';
import { deleteReminder, saveReminder } from '../db';
import { REMINDER_PRESETS } from '../constants';
import { currentOdometer } from '../lib/calc';
import { today } from '../lib/dates';
import { parseInteger } from '../lib/format';
import type { Reminder } from '../types';
import { btn, chip, chips, error as errorText, field, fieldset, form, grid2, hint, input, legend, main, splash } from '../ui';
import { paths } from '../routes/paths';

export default function ReminderFormPage() {
  const { vid, rid } = useParams();
  const uid = useUid();
  const vehicle = useVehicle(uid, vid);
  const entries = useEntries(uid, vid);
  const reminders = useReminders(uid, vid);

  if (vehicle.loading || entries.loading || reminders.loading) return <div className={splash}>Carregando…</div>;
  if (!vehicle.data || !vid) return <div className={splash}>Veículo não encontrado.</div>;

  const reminder = rid ? reminders.data.find((r) => r.id === rid) ?? null : null;
  if (rid && !reminder) return <div className={splash}>Lembrete não encontrado.</div>;

  return (
    <ReminderForm
      key={rid ?? 'new'}
      uid={uid}
      vid={vid}
      vehicleName={vehicle.data.name}
      current={currentOdometer(vehicle.data, entries.data)}
      reminder={reminder}
    />
  );
}

interface Props {
  uid: string;
  vid: string;
  vehicleName: string;
  current: number;
  reminder: Reminder | null;
}

const str = (n: number | null | undefined) => (n == null ? '' : String(n));

function ReminderForm({ uid, vid, vehicleName, current, reminder }: Props) {
  const navigate = useNavigate();
  const back = paths.vehicle(vid, 'lembretes');

  const [title, setTitle] = useState(reminder?.title ?? '');
  const [everyKm, setEveryKm] = useState(str(reminder?.intervalKm));
  const [everyMonths, setEveryMonths] = useState(str(reminder?.intervalMonths));
  const [lastKm, setLastKm] = useState(str(reminder?.lastKm ?? current));
  const [lastDate, setLastDate] = useState(reminder?.lastDate ?? today());
  const [error, setError] = useState('');

  function applyPreset(p: (typeof REMINDER_PRESETS)[number]) {
    setTitle(p.title);
    setEveryKm(str(p.intervalKm));
    setEveryMonths(str(p.intervalMonths));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const intervalKm = parseInteger(everyKm) || null;
    const intervalMonths = parseInteger(everyMonths) || null;
    if (!title.trim()) return setError('Dê um nome ao lembrete.');
    if (!intervalKm && !intervalMonths) return setError('Defina um intervalo em km, em meses, ou os dois.');

    saveReminder(uid, vid, reminder?.id, {
      title: title.trim(),
      intervalKm,
      intervalMonths,
      lastKm: parseInteger(lastKm) ?? current,
      lastDate: lastDate || today(),
      createdAt: reminder?.createdAt ?? Date.now(),
    });
    navigate(back, { replace: true });
  }

  function remove() {
    if (!reminder || !confirm(`Excluir o lembrete "${reminder.title}"?`)) return;
    deleteReminder(uid, vid, reminder.id);
    navigate(back, { replace: true });
  }

  return (
    <>
      <Header title={reminder ? 'Editar lembrete' : 'Novo lembrete'} subtitle={vehicleName} back={back} />
      <main className={main}>
        <form className={form} onSubmit={submit}>
          {!reminder && (
            <div className={`${chips} flex-wrap`}>
              {REMINDER_PRESETS.map((p) => (
                <button type="button" key={p.title} className={chip(title === p.title)} onClick={() => applyPreset(p)}>
                  {p.title}
                </button>
              ))}
            </div>
          )}

          <label className={field}>
            Nome
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Troca de óleo" />
          </label>

          <fieldset className={fieldset}>
            <legend className={legend}>Repetir a cada</legend>
            <div className={grid2}>
              <label className={field}>
                Km
                <input className={input} value={everyKm} onChange={(e) => setEveryKm(e.target.value)} inputMode="numeric" placeholder="10000" />
              </label>
              <label className={field}>
                Meses
                <input className={input} value={everyMonths} onChange={(e) => setEveryMonths(e.target.value)} inputMode="numeric" placeholder="12" />
              </label>
            </div>
            <small className={hint}>Preenchendo os dois, vale o que vencer primeiro.</small>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Última vez que foi feito</legend>
            <div className={grid2}>
              <label className={field}>
                Km
                <input className={input} value={lastKm} onChange={(e) => setLastKm(e.target.value)} inputMode="numeric" />
              </label>
              <label className={field}>
                Data
                <input className={input} type="date" value={lastDate} max={today()} onChange={(e) => setLastDate(e.target.value)} />
              </label>
            </div>
          </fieldset>

          {error && <p className={errorText}>{error}</p>}
          <button className={`${btn('primary')} w-full`} type="submit">
            Salvar
          </button>
          {reminder && (
            <button type="button" className={`${btn('danger')} w-full`} onClick={remove}>
              Excluir lembrete
            </button>
          )}
        </form>
      </main>
    </>
  );
}
