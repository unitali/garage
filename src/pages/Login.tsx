import { useEffect, useState, type ReactNode } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { CircleCheck, Download, EllipsisVertical, Share, SquarePlus, Smartphone } from 'lucide-react';
import { auth } from '../firebase';
import { login } from '../auth';
import { touchDevice, useInstall, useJustInstalled } from '../pwa';
import { btn, card, error as errorText } from '../ui';
import FlagStripe from '../components/FlagStripe';
import logoUrl from '../assets/logo.png';

const IGNORED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const install = useInstall();
  const justInstalled = useJustInstalled();

  // volta do login por redirecionamento (app instalado): o usuário entra sozinho; aqui só mostramos erro
  useEffect(() => {
    getRedirectResult(auth).catch(fail);
  }, []);

  function fail(e: unknown) {
    const code = (e as { code?: string }).code ?? '';
    if (IGNORED.includes(code)) return;
    console.error(e);
    setError('Não foi possível entrar. Tente de novo.');
  }

  async function handleLogin() {
    setError('');
    setBusy(true);
    try {
      await login();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  // no navegador, com instalação disponível: baixar o app é o caminho principal
  const offerInstall = !!install || justInstalled;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <img src={logoUrl} alt="" className="size-24" />
      <h1 className="text-3xl font-bold">
        Unitali <span className="text-brand">Garage</span>
      </h1>
      {/* contorno: no fundo claro o branco do meio sumiria */}
      <FlagStripe className="h-1.5 w-16 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-800" />
      <p className="mb-3 max-w-[300px] text-slate-600 dark:text-slate-400">Manutenções, abastecimentos e despesas dos seus veículos, sempre à mão.</p>

      {offerInstall && (
        <section className={`${card} mb-2 flex w-full max-w-sm flex-col gap-3 text-left`}>
          {justInstalled ? (
            <div className="flex items-start gap-3">
              <CircleCheck className="size-6 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <div className="flex flex-col gap-0.5">
                <strong>App instalado!</strong>
                <span className="text-sm text-slate-600 dark:text-slate-400">Abra o Unitali Garage pela tela inicial e entre por lá.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Smartphone className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong>Baixe o app</strong>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Instale e entre direto pelo app: abre da tela inicial e funciona sem internet.</span>
                </div>
              </div>
              {install?.kind === 'prompt' && (
                <button className={`${btn('primary')} w-full gap-2`} onClick={install.install}>
                  <Download className="size-5" />
                  Baixar o app
                </button>
              )}
              {install?.kind === 'menu' && (
                <ol className="flex flex-col gap-2 text-sm" aria-label="Se a instalação não abriu">
                  <Step n={1} icon={<EllipsisVertical className="size-4" />}>
                    {touchDevice ? 'Toque' : 'Clique'} no menu <b>⋮</b> do navegador
                  </Step>
                  <Step n={2} icon={<SquarePlus className="size-4" />}>
                    {touchDevice ? (
                      <>
                        Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>)
                      </>
                    ) : (
                      <>
                        <b>Transmitir, salvar e compartilhar</b> → <b>Instalar página como app</b>
                      </>
                    )}
                  </Step>
                  <Step n={3} icon={<Smartphone className="size-4" />}>
                    Abra o app pelo ícone e entre com Google
                  </Step>
                </ol>
              )}
              {install?.kind === 'ios' && (
                <ol className="flex flex-col gap-2 text-sm">
                  <Step n={1} icon={<Share className="size-4" />}>
                    No Safari, toque em <b>Compartilhar</b>
                  </Step>
                  <Step n={2} icon={<SquarePlus className="size-4" />}>
                    Escolha <b>Adicionar à Tela de Início</b>
                  </Step>
                  <Step n={3} icon={<Smartphone className="size-4" />}>
                    Abra o app pelo ícone e entre com Google
                  </Step>
                </ol>
              )}
            </>
          )}
        </section>
      )}

      {offerInstall && <span className="text-sm text-slate-600 dark:text-slate-400">ou continue no navegador</span>}
      <button className={btn(offerInstall ? 'default' : 'primary')} onClick={handleLogin} disabled={busy}>
        {busy ? 'Entrando…' : 'Entrar com Google'}
      </button>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-contrast">{n}</span>
      <span className="flex-1">{children}</span>
      <span className="text-slate-600 dark:text-slate-400">{icon}</span>
    </li>
  );
}
