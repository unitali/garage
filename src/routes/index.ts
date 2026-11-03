import { createElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import Home from '../pages/Home';
import History from '../pages/History';
import RemindersPage from '../pages/RemindersPage';
import More from '../pages/More';
import OdometerForm from '../pages/OdometerForm';
import Profile from '../pages/Profile';
import Vehicles from '../pages/Vehicles';
import Categories from '../pages/Categories';
import ReminderSettings from '../pages/ReminderSettings';
import VehicleForm from '../pages/VehicleForm';
import OpenVehicle from '../pages/OpenVehicle';
import EntryForm from '../pages/EntryForm';
import ReminderForm from '../pages/ReminderForm';
import { PATTERNS, paths } from './paths';

export * from './paths';

export interface RouteHandle {
  /** mostra a barra de baixo; formulários ocupam a tela toda, como num app */
  bottomNav?: boolean;
}

const tabBar: RouteHandle = { bottomNav: true };
const toMore = () => createElement(Navigate, { to: paths.more(), replace: true });

/** Todas as telas do app (usuário logado). */
export const routes: RouteObject[] = [
  { path: PATTERNS.home, Component: Home, handle: tabBar },
  { path: PATTERNS.history, Component: History, handle: tabBar },
  { path: PATTERNS.reminders, Component: RemindersPage, handle: tabBar },
  { path: PATTERNS.more, Component: More, handle: tabBar },
  // links antigos: a calculadora está no abastecimento e as configurações no Mais
  { path: PATTERNS.calculator, Component: toMore },
  { path: PATTERNS.settings, Component: toMore },
  { path: PATTERNS.profile, Component: Profile, handle: tabBar },
  { path: PATTERNS.vehicles, Component: Vehicles, handle: tabBar },
  { path: PATTERNS.categories, Component: Categories, handle: tabBar },
  { path: PATTERNS.reminderSettings, Component: ReminderSettings, handle: tabBar },
  { path: PATTERNS.newVehicle, Component: VehicleForm },
  { path: PATTERNS.vehicle, Component: OpenVehicle },
  { path: PATTERNS.editVehicle, Component: VehicleForm },
  { path: PATTERNS.odometer, Component: OdometerForm },
  { path: PATTERNS.newEntry, Component: EntryForm },
  { path: PATTERNS.entry, Component: EntryForm },
  { path: PATTERNS.newReminder, Component: ReminderForm },
  { path: PATTERNS.reminder, Component: ReminderForm },
  { path: '*', Component: () => createElement(Navigate, { to: paths.home(), replace: true }) },
];
