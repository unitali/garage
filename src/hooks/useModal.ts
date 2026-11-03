import { useEffect, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento de janela modal: ao abrir, o foco vai para `initial` (ou o primeiro item focável do
 * `panel`) e a página de trás para de rolar. Devolve o onKeyDown do fundo: Esc chama `onEscape` e o
 * Tab fica preso dentro do painel. Montar o componente = abrir.
 */
export function useModal(panel: RefObject<HTMLElement | null>, onEscape: () => void, initial?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    (initial?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
    // só ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      return onEscape();
    }
    if (e.key !== 'Tab') return;
    const items = [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };
}
