import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Fuel, Gauge, X, type LucideIcon } from 'lucide-react';
import { brl, km } from '../lib/format';
import { paths } from '../routes/paths';
import type { Entry, Vehicle } from '../types';
import { iconCircle, KIND_ICON, KIND_SOFT, REMINDER_ICON, REMINDER_SOFT } from '../ui';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Painel "Adicionar" (abre pelo + da barra de baixo): Abastecer em destaque e a grade com
 * Serviço, Despesa, Lembrete e Atualizar km. Cada item abre o formulário correspondente.
 * Fecha com Esc, com o X ou tocando fora; o foco fica preso dentro enquanto aberto.
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
  const sheet = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    // a página de trás não rola enquanto o painel está aberto
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return onClose();
    if (e.key !== 'Tab') return;
    // foco preso: Tab no último volta ao primeiro (e Shift+Tab ao contrário)
    const items = [...(sheet.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  function go(to: (vid: string) => string) {
    onClose();
    navigate(vehicle ? to(vehicle.id) : paths.newVehicle());
  }

  const lastFuel = entries
    .filter((e) => e.kind === 'fuel')
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0];

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-[rgba(15,23,42,.5)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
    >
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sheet-title"
        className="mx-auto w-full max-w-3xl rounded-t-3xl bg-surface px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] text-ink shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="add-sheet-title" className="text-lg font-bold">
              Adicionar
            </h2>
            {vehicle && (
              <p className="text-sm text-muted">
                {vehicle.name} · {km(odometer)}
              </p>
            )}
          </div>
          <button className="grid size-11 place-items-center rounded-xl text-muted active:bg-bg" aria-label="Fechar" onClick={onClose}>
            <X className="size-6" />
          </button>
        </div>

        <button
          className="mb-3 flex min-h-11 w-full items-center gap-3 rounded-2xl bg-brand p-4 text-left text-brand-contrast"
          onClick={() => go((vid) => paths.newEntry(vid, 'fuel'))}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/12">
            <Fuel className="size-6" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-lg">Abastecer</strong>
            <span className="text-sm opacity-85">
              {lastFuel ? `${lastFuel.fuelType ?? 'Combustível'} · último ${brl(lastFuel.pricePerLiter ?? 0)}/L` : 'Registre o primeiro abastecimento'}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Tile icon={KIND_ICON.service} tone={KIND_SOFT.service} title="Serviço" hint="óleo, pneus, revisão" onClick={() => go((vid) => paths.newEntry(vid, 'service'))} />
          <Tile icon={KIND_ICON.expense} tone={KIND_SOFT.expense} title="Despesa" hint="IPVA, seguro, multa" onClick={() => go((vid) => paths.newEntry(vid, 'expense'))} />
          <Tile icon={REMINDER_ICON} tone={REMINDER_SOFT} title="Lembrete" hint="por km ou data" onClick={() => go(paths.newReminder)} />
          <Tile icon={Gauge} tone="bg-ok-bg text-ok" title="Atualizar km" hint="sem gasto" onClick={() => go(paths.odometer)} />
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, tone, title, hint, onClick }: { icon: LucideIcon; tone: string; title: string; hint: ReactNode; onClick: () => void }) {
  return (
    <button className="flex min-h-11 flex-col items-start gap-2 rounded-2xl border border-line p-3.5 text-left active:bg-bg" onClick={onClick}>
      <span className={`${iconCircle} ${tone}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <strong>{title}</strong>
      <span className="text-sm text-muted">{hint}</span>
    </button>
  );
}
