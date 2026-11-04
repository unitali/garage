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
// Já tocou em "Instalar": o evento só vale uma vez. Se a janela do navegador não abriu (acontece no
// Android) ou foi fechada, sobra o caminho pelo menu do navegador — que passa a aparecer na tela.
const promptUsed = createStore(false);
// instalou agora, pelo navegador: o app abre pela tela inicial (não dá para trocar de janela daqui)
const justInstalled = createStore(false);
addEventListener('appinstalled', () => {
  installEvent.set(null);
  promptUsed.set(false);
  justInstalled.set(true);
});

/** Abre a janela de instalação do navegador; os passos pelo menu já ficam na tela caso ela não apareça. */
function promptInstall(event: BeforeInstallPromptEvent) {
  installEvent.set(null);
  promptUsed.set(true);
  event.prompt().catch(() => {}); // falhou: os passos pelo menu já estão visíveis
}

export const useJustInstalled = () => useStore(justInstalled);

/** Rodando como app instalado (tela inicial), não numa aba do navegador. */
export const isStandalone =
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

// iPadOS se identifica como Mac; o toque denuncia
const ios =
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** celular/tablet (toque) ou computador: muda onde fica o "Instalar" no menu do navegador */
export const touchDevice = matchMedia('(pointer: coarse)').matches;

/**
 * - prompt: botão "Instalar" (Chrome/Edge/Android)
 * - menu: sem botão (já usado, ou o navegador não ofereceu): instalar pelo menu do navegador
 * - ios: não há botão; instalar pelo Compartilhar do Safari
 */
export type Install = { kind: 'prompt'; install: () => void } | { kind: 'menu' } | { kind: 'ios' };

/**
 * Como oferecer a instalação neste navegador, ou null se já está no app instalado.
 * Sem `always`, também null quando o navegador não ofereceu nada (pode já estar instalado — o aviso
 * da tela inicial não insiste); com `always` (tela Mais), cai no caminho pelo menu.
 */
export function useInstall({ always = false } = {}): Install | null {
  const event = useStore(installEvent);
  const used = useStore(promptUsed);
  if (isStandalone) return null;
  if (event) return { kind: 'prompt', install: () => promptInstall(event) };
  if (ios) return { kind: 'ios' };
  return used || always ? { kind: 'menu' } : null;
}
