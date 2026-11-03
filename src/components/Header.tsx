import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import FlagStripe from './FlagStripe';
import StatusStrip from './StatusStrip';
import logoUrl from '../assets/logo.png';

interface Props {
  title: string;
  subtitle?: string;
  /** rota para voltar; se omitido, não mostra o botão */
  back?: string;
  /** mostra o logo antes do título (tela inicial) */
  logo?: boolean;
  right?: ReactNode;
  /** segunda linha dentro da barra, abaixo do título (ex: seletor de veículo); posicionada com `relative` */
  bottom?: ReactNode;
  /** conteúdo fixo logo abaixo da barra (ex: abas) */
  children?: ReactNode;
  /** a barra rola com a página e só as abas/avisos ficam presos no topo (mais espaço para o conteúdo) */
  scrollAway?: boolean;
}

export default function Header({ title, subtitle, back, logo, right, bottom, children, scrollAway }: Props) {
  const navigate = useNavigate();
  const bar = (
    <>
      <header className="bg-bar px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 text-bar-ink">
        <div className="flex items-center gap-2">
          {back && (
            <button className="pr-2 pb-1 text-[2rem] leading-none" aria-label="Voltar" onClick={() => navigate(back)}>
              ‹
            </button>
          )}
          {/* fundo branco: o U azul-marinho sumiria na barra da mesma cor */}
          {logo && <img src={logoUrl} alt="" className="size-8 shrink-0 rounded-lg bg-white object-contain p-1" />}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            {subtitle && <span className="text-[0.8rem] opacity-85">{subtitle}</span>}
          </div>
          {right}
        </div>
        {bottom && <div className="relative mt-2.5">{bottom}</div>}
      </header>
      <FlagStripe className="h-0.75" />
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
