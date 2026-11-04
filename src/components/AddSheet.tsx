import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import Sheet from './Sheet';
import { brl, km } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry, Vehicle } from '../types';
import { entrySoft, iconCircle, KIND_ICON, KIND_SOFT, REMINDER_ICON, REMINDER_SOFT } from '../ui';

/**
 * Painel "Adicionar" (abre pelo + da barra de baixo): grade com Abastecer, Serviço, Despesa e
 * Lembrete. Cada item abre o formulário correspondente.
 */
export default function AddSheet({
  open,
  onClose,
  vehicle,
  odometer,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  odometer: number;
  entries: Entry[];
}) {
  const navigate = useNavigate();

  function go(to: (vid: string) => string) {
    onClose();
    navigate(vehicle ? to(vehicle.id) : paths.newVehicle());
  }

  const lastFuel = entries
    .filter((e) => e.kind === 'fuel')
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0];

  return (
    <Sheet open={open} onClose={onClose} aboveNav title="Adicionar" subtitle={vehicle && `${vehicle.name} · ${km(odometer)}`}>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          icon={KIND_ICON.fuel}
          tone={lastFuel ? entrySoft(lastFuel) : KIND_SOFT.fuel} // na cor do último combustível
          title="Abastecer"
          hint={lastFuel?.pricePerLiter ? `último ${brl(lastFuel.pricePerLiter)}/L` : 'gasolina, etanol…'}
          onClick={() => go((vid) => paths.newEntry(vid, 'fuel'))}
        />
        <Tile icon={KIND_ICON.service} tone={KIND_SOFT.service} title="Serviço" hint="óleo, pneus, revisão" onClick={() => go((vid) => paths.newEntry(vid, 'service'))} />
        <Tile icon={KIND_ICON.expense} tone={KIND_SOFT.expense} title="Despesa" hint="IPVA, seguro, multa" onClick={() => go((vid) => paths.newEntry(vid, 'expense'))} />
        <Tile icon={REMINDER_ICON} tone={REMINDER_SOFT} title="Lembrete" hint="por km ou data" onClick={() => go(paths.newReminder)} />
      </div>
    </Sheet>
  );
}

function Tile({ icon: Icon, tone, title, hint, onClick }: { icon: LucideIcon; tone: string; title: string; hint: ReactNode; onClick: () => void }) {
  return (
    <button className="flex min-h-11 flex-col items-start gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 text-left active:bg-slate-100 dark:active:bg-slate-950" onClick={onClick}>
      <span className={`${iconCircle} ${tone}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <strong>{title}</strong>
      <span className="text-sm text-slate-600 dark:text-slate-400">{hint}</span>
    </button>
  );
}
