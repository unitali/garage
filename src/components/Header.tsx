import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FlagStripe from './FlagStripe';
import StatusStrip from './StatusStrip';
import VehicleSwitcher from './VehicleSwitcher';
import { useUid } from '../auth';
import { useVehicles } from '../hooks';
import { useSelectedVehicle } from '../selection';
import type { Vehicle } from '../types';
import logoUrl from '../assets/logo.png';

interface Props {
  /** nome da tela aberta */
  title: string;
  /** rota para voltar; se omitido, não mostra o botão */
  back?: string;
  right?: ReactNode;
  /**
   * Veículo abaixo do título. Padrão: seletor do veículo selecionado (some sem veículos).
   * Um veículo: só exibe, sem trocar (formulários dele). `false`: sem a linha do veículo.
   */
  vehicle?: Vehicle | false;
  /** km atual do veículo, quando a tela já calcula (senão, o salvo no veículo) */
  odometer?: number;
  /** conteúdo fixo logo abaixo da barra (ex: abas) */
  children?: ReactNode;
  /** a barra rola com a página e só as abas/avisos ficam presos no topo (mais espaço para o conteúdo) */
  scrollAway?: boolean;
}

/** Cabeçalho de todas as telas: logo + nome da tela e, embaixo, o veículo. */
export default function Header({ title, back, right, vehicle, odometer, children, scrollAway }: Props) {
  const navigate = useNavigate();
  const uid = useUid();
  const vehicles = useVehicles(uid).data;
  const selected = useSelectedVehicle(vehicles);
  const shown = vehicle === false ? null : (vehicle ?? selected);

  const bar = (
    <>
      <header className="bg-bar px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-3 text-bar-ink">
        <div className="flex items-center gap-2.5">
          {back && (
            <button className="-ml-2 grid size-11 shrink-0 place-items-center rounded-xl active:bg-white/10" aria-label="Voltar" onClick={() => navigate(back)}>
              <ChevronLeft className="size-7" aria-hidden />
            </button>
          )}
          {/* o logo inteiro, sem padding nem margem; os cantos fora do arredondado já vêm transparentes */}
          <img src={logoUrl} alt="" className="size-9 shrink-0" />
          <h1 className="min-w-0 flex-1 text-xl font-bold wrap-break-words">{title}</h1>
          {right}
        </div>
        {shown && (
          <div className="mt-3">
            <VehicleSwitcher vehicles={vehicles} current={shown} odometer={odometer} readOnly={vehicle !== undefined} />
          </div>
        )}
      </header>
      <FlagStripe className="h-1" />
    </>
  );
  const pinned = (
    <>
      <StatusStrip />
      {children}
    </>
  );

  if (!scrollAway) {
    return (
      <div className="sticky top-0 z-10">
        {bar}
        {pinned}
      </div>
    );
  }
  return (
    <>
      {bar}
      {/* faixa da área segura em azul: no iPhone as abas não ficam embaixo do relógio */}
      <div className="sticky top-0 z-10 bg-bar pt-[env(safe-area-inset-top)]">{pinned}</div>
    </>
  );
}
