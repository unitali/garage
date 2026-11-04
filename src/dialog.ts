import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { createStore, useStore } from './lib/store';

// Pop-up de confirmação/aviso do app (no lugar de confirm()/alert() do navegador).
// Uso: `if (!(await ask({ title, message, confirmLabel, tone: 'danger' }))) return;`
// Quem desenha é o <DialogHost /> (montado uma vez em main.tsx).

export interface DialogOptions {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  /** null = só o botão de confirmar (aviso) */
  cancelLabel?: string | null;
  /** danger: vermelho, foco começa em Cancelar; primary: azul, foco no botão de confirmar */
  tone?: 'danger' | 'primary';
  icon?: LucideIcon;
  /** ação demorada (ex: excluir no servidor): o pop-up mostra "Aguarde…" e só fecha se der certo */
  action?: () => Promise<unknown> | unknown;
  /** mensagem se a ação falhar (o pop-up continua aberto para tentar de novo) */
  errorText?: string;
}

interface Open extends DialogOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

const current = createStore<Open | null>(null);
let seq = 0;

/** Abre o pop-up; resolve true ao confirmar (depois da `action`, se houver) e false ao cancelar. */
export function ask(options: DialogOptions): Promise<boolean> {
  current.get()?.resolve(false); // um por vez: o anterior conta como cancelado
  return new Promise((resolve) =>
    current.set({
      ...options,
      id: ++seq,
      resolve: (ok) => {
        current.set(null);
        resolve(ok);
      },
    }),
  );
}

/** Aviso com um botão só (ex: erro ao salvar). */
export const notify = (title: string, message?: ReactNode) => ask({ title, message, confirmLabel: 'Entendi', cancelLabel: null });

export const useDialog = () => useStore(current);
