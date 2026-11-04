import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { field, input } from '../ui';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** ícone opcional à esquerda (ex: tipo de veículo) */
  icon?: LucideIcon;
}

interface Props<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** rótulo visível acima do campo */
  label?: ReactNode;
  /** sem rótulo visível (ex: dentro de um grid "item + valor"): nome só para leitor de tela */
  ariaLabel?: string;
  /** texto pequeno abaixo do campo */
  hint?: ReactNode;
  /** mostrado quando `value` não é uma das opções */
  placeholder?: string;
  /** dentro de uma linha com outros campos: espaçamento e seta menores (sobra mais lugar para o texto) */
  compact?: boolean;
}

const iconBox = 'grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand';
/** para a busca pela primeira letra: sem acento e minúsculo ("o" acha "Óleo") */
const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Select do app (no lugar do <select> nativo): mesmo visual dos campos, seta alinhada ao texto e
 * ícone opcional por opção. Toque/clique abre; no teclado, setas/Home/End escolhem, Enter/Espaço
 * confirmam, uma letra pula para a opção que começa com ela e Esc fecha devolvendo o foco.
 */
export default function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  ariaLabel,
  hint,
  placeholder = 'Selecione…',
  compact = false,
}: Props<T>) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(0);
  const current = options[selected];

  // ao abrir, o foco vai para a lista (é ela que recebe as teclas)
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);
  // lista longa: a opção destacada fica sempre visível
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  function show() {
    setActive(Math.max(0, selected));
    setOpen(true);
  }
  function close() {
    setOpen(false);
    button.current?.focus();
  }
  function pick(i: number) {
    if (options[i].value !== value) onChange(options[i].value);
    close();
  }

  function onButtonKey(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      show();
    }
  }
  function onListKey(e: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // dentro de um painel: fecha só a lista
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1) {
      // primeira letra: próxima opção que começa com ela (sem acento, sem maiúscula)
      const letter = plain(e.key);
      const order = [...options.keys()].map((k) => (active + 1 + k) % options.length);
      const next = order.find((i) => plain(options[i].label).startsWith(letter));
      if (next != null) setActive(next);
    }
  }

  const CurrentIcon = current?.icon;
  const control = (
    <div className="relative">
      <button
        ref={button}
        type="button"
        className={`${compact ? input.replace('px-3', 'px-2.5') : input} flex items-center text-left ${compact ? 'gap-1.5' : 'gap-3'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ? `${ariaLabel}: ${current?.label ?? placeholder}` : undefined}
        aria-labelledby={ariaLabel ? undefined : `${id}-label ${id}-value`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onButtonKey}
      >
        {CurrentIcon && (
          <span className={iconBox}>
            <CurrentIcon className="size-5" aria-hidden />
          </span>
        )}
        <span id={`${id}-value`} className={`min-w-0 flex-1 break-words ${current ? '' : 'text-slate-600 dark:text-slate-400'}`}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown className={`${compact ? 'size-4' : 'size-5'} shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <ul
            ref={list}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : `${id}-label`}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKey}
            className="absolute top-full left-0 z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-base font-normal text-slate-900 shadow-xl outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {options.map((o, i) => {
              const Icon = o.icon;
              return (
                <li
                  key={o.value}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === selected}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 ${i === active ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                >
                  {Icon && (
                    <span className={iconBox}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 break-words">{o.label}</span>
                  {i === selected && <Check className="size-5 shrink-0 text-brand" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );

  if (!label) return control;
  return (
    <div className={field}>
      <span id={`${id}-label`}>{label}</span>
      {control}
      {hint && <small className="text-xs font-normal text-slate-600 dark:text-slate-400">{hint}</small>}
    </div>
  );
}
