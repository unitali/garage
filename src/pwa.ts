import { registerSW } from 'virtual:pwa-register';
import { createStore, useStore } from './lib/store';

// ---------- atualização ----------

const needRefresh = createStore(false);

const updateSW = registerSW({
  onNeedRefresh: () => needRefresh.set(true),
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    // O app instalado fica aberto por dias: procura versão nova a cada hora e ao voltar para ele
    const check = () => {
      reg.update().catch(() => {}); // sem rede só falha; tenta de novo na próxima
    };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

export const useUpdateAvailable = () => useStore(needRefresh);

/** Ativa o service worker novo e recarrega. Gravações pendentes ficam no IndexedDB e seguem depois. */
export const applyUpdate = () => updateSW(true);

// ---------- instalação ----------

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Chrome/Edge/Android disparam o evento cedo: guardamos para oferecer o botão "Instalar" depois
const installEvent = createStore<BeforeInstallPromptEvent | null>(null);
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent.set(e as BeforeInstallPromptEvent);
});
// instalou agora, pelo navegador: o app abre pela tela inicial (não dá para trocar de janela daqui)
const justInstalled = createStore(false);
addEventListener('appinstalled', () => {
  installEvent.set(null);
  justInstalled.set(true);
});

export const useJustInstalled = () => useStore(justInstalled);

/** Rodando como app instalado (tela inicial), não numa aba do navegador. */
export const isStandalone =
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

// iPadOS se identifica como Mac; o toque denuncia
const ios =
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export type Install = { kind: 'prompt'; install: () => Promise<void> } | { kind: 'ios' };

/** Como oferecer a instalação neste navegador, ou null se já instalado / não suportado. */
export function useInstall(): Install | null {
  const event = useStore(installEvent);
  if (isStandalone) return null;
  if (event)
    return {
      kind: 'prompt',
      async install() {
        await event.prompt();
        await event.userChoice;
        installEvent.set(null); // o evento só pode ser usado uma vez
      },
    };
  // iOS não tem prompt: só pelo menu Compartilhar
  return ios ? { kind: 'ios' } : null;
}
