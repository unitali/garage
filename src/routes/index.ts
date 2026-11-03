import { createElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
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
  /** mostra a barra de atalhos de baixo; formulários ocupam a tela toda, como num app */
  tabBar?: boolean;
}

const tabBar: RouteHandle = { tabBar: true };

/** Todas as telas do app (usuário logado). */
export const routes: RouteObject[] = [
  { path: PATTERNS.home, Component: Home, handle: tabBar },
  { path: PATTERNS.settings, Component: Settings, handle: tabBar },
  { path: PATTERNS.profile, Component: Profile, handle: tabBar },
  { path: PATTERNS.vehicles, Component: Vehicles, handle: tabBar },
  { path: PATTERNS.categories, Component: Categories, handle: tabBar },
  { path: PATTERNS.reminderSettings, Component: ReminderSettings, handle: tabBar },
  { path: PATTERNS.newVehicle, Component: VehicleForm },
  { path: PATTERNS.vehicle, Component: OpenVehicle },
  { path: PATTERNS.editVehicle, Component: VehicleForm },
  { path: PATTERNS.newEntry, Component: EntryForm },
  { path: PATTERNS.entry, Component: EntryForm },
  { path: PATTERNS.newReminder, Component: ReminderForm },
  { path: PATTERNS.reminder, Component: ReminderForm },
  { path: '*', Component: () => createElement(Navigate, { to: paths.home(), replace: true }) },
];
