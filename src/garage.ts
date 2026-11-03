import { useMemo } from 'react';
import { useUid } from './auth';
import { useAlertWindow, useEntries, useReminders, useVehicles } from './hooks';
import { billsDue, currentOdometer, kmPerDay, remindersByDue } from './lib/calc';
import { useSelectedVehicle } from './selection';

/**
 * Dados do veículo selecionado usados por Início, Histórico, Lembretes, barra de baixo e "Adicionar".
 * As assinaturas do Firestore são as mesmas em todo lugar (o SDK reaproveita a mesma consulta).
 */
export function useGarage() {
  const uid = useUid();
  const vehicles = useVehicles(uid);
  const vehicle = useSelectedVehicle(vehicles.data);
  const entries = useEntries(uid, vehicle?.id);
  const reminders = useReminders(uid, vehicle?.id);
  const alert = useAlertWindow(uid);

  const current = useMemo(() => currentOdometer(vehicle, entries.data), [vehicle, entries.data]);
  const rate = useMemo(() => kmPerDay(vehicle, entries.data), [vehicle, entries.data]);
  const due = useMemo(
    () => remindersByDue(reminders.data, current, rate, undefined, alert),
    [reminders.data, current, rate, alert.km, alert.months, alert.urgentKm, alert.urgentDays], // eslint-disable-line react-hooks/exhaustive-deps
  );
  /** contas em aberto dentro do aviso (parcelas/recorrentes/despesas futuras) e vencidas */
  const bills = useMemo(
    () => billsDue(entries.data, undefined, alert),
    [entries.data, alert.urgentDays], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const overdue = due.filter((d) => d.s.level === 'overdue').length + bills.filter((b) => b.s.level === 'overdue').length;

  return {
    uid,
    vehicles: vehicles.data,
    vehicle,
    entries: entries.data,
    reminders: reminders.data,
    current,
    rate,
    alert,
    due,
    bills,
    /** lembretes + contas vencidos (badge da barra de baixo) */
    overdue,
    loading: vehicles.loading || (vehicle != null && (entries.loading || reminders.loading)),
  };
}
