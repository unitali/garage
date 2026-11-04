import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, Search, type LucideIcon } from 'lucide-react';
import { field, input } from '../ui';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** ícone opcional à esquerda (ex: tipo de veículo) */
  icon?: LucideIcon;
}

/** Ação fixa no rodapé da lista (ex: "+ Adicionar serviço…"): sempre visível, mesmo filtrando. */
export interface SelectAction {
  /** recebe o que está na busca ('' sem busca), para o texto poder citar o que foi digitado */
  label: (query: string) => string;
  icon?: LucideIcon;
  onSelect: (query: string) => void;
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
  /** campo de busca no topo da lista (listas longas, como os tipos de serviço) */
  searchable?: boolean;
  action?: SelectAction;
}

const iconBox = 'grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand';
const optionRow = 'flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5';
/** comparação sem acento e sem maiúscula ("o" acha "Óleo", "pastilha" acha "Pastilhas") */
const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Select do app (no lugar do <select> nativo): mesmo visual dos campos, seta alinhada ao texto e
 * ícone opcional por opção. Toque/clique abre; no teclado, setas/Home/End escolhem, Enter confirma e
 * Esc fecha devolvendo o foco. Sem busca, uma letra pula para a opção que começa com ela; com busca
 * (`searchable`), digitar filtra. `action` fica fixa no rodapé da lista.
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
  searchable = false,
  action,
}: Props<T>) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const current = options.find((o) => o.value === value);
  const shown = query ? options.filter((o) => plain(o.label).includes(plain(query.trim()))) : options;
  // posições navegáveis: as opções filtradas e, por último, a ação
  const count = shown.length + (action ? 1 : 0);
  const actionIndex = action ? shown.length : -1;
  const optionId = (i: number) => (i === actionIndex ? `${id}-action` : `${id}-${i}`);

  // ao abrir, o foco vai para quem recebe as teclas: a busca ou a própria lista
  useEffect(() => {
    if (open) (searchable ? search.current : list.current)?.focus();
  }, [open, searchable]);
  // lista longa: a opção destacada fica sempre visível
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function show() {
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }
  function close() {
    setOpen(false);
    button.current?.focus();
  }
  function choose(i: number) {
    if (i === actionIndex) {
      setOpen(false);
      action!.onSelect(query.trim());
      return;
    }
    if (shown[i] && shown[i].value !== value) onChange(shown[i].value);
    close();
  }

  function onButtonKey(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      show();
    }
  }
  function onListKey(e: KeyboardEvent) {
    const last = count - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1) };
    // na busca, Home/End/Espaço são do texto
    if (!searchable) Object.assign(moves, { Home: 0, End: last });
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || (!searchable && e.key === ' ')) {
      e.preventDefault();
      if (count > 0) choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // dentro de um painel: fecha só a lista
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (!searchable && e.key.length === 1) {
      // primeira letra: próxima opção que começa com ela
      const letter = plain(e.key);
      const order = [...shown.keys()].map((k) => (active + 1 + k) % shown.length);
      const next = order.find((i) => plain(shown[i].label).startsWith(letter));
      if (next != null) setActive(next);
    }
  }

  const CurrentIcon = current?.icon;
  const ActionIcon = action?.icon;
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
          <div className="absolute top-full left-0 z-30 mt-1 flex max-h-80 w-full min-w-56 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-base font-normal text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {searchable && (
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
                <Search className="size-4 shrink-0 text-slate-500" aria-hidden />
                <input
                  ref={search}
                  type="search"
                  role="combobox"
                  aria-expanded
                  aria-controls={`${id}-list`}
                  aria-autocomplete="list"
                  aria-activedescendant={count > 0 ? optionId(active) : undefined}
                  aria-label={`Buscar ${typeof label === 'string' ? label.toLowerCase() : (ariaLabel ?? 'opção').toLowerCase()}`}
                  className="min-h-11 w-full min-w-0 bg-transparent outline-none placeholder:text-slate-500"
                  placeholder="Buscar…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKey}
                />
              </div>
            )}
            <ul
              ref={list}
              id={`${id}-list`}
              role="listbox"
              tabIndex={searchable ? undefined : -1}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabel ? undefined : `${id}-label`}
              aria-activedescendant={!searchable && count > 0 ? optionId(active) : undefined}
              onKeyDown={searchable ? undefined : onListKey}
              // com ação fixa, sem espaço embaixo: senão a opção que rola aparece por baixo dela
              className={`min-h-0 flex-1 overflow-y-auto pt-1 outline-none ${action ? '' : 'pb-1'}`}
            >
              {shown.map((o, i) => {
                const Icon = o.icon;
                return (
                  <li
                    key={o.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={o.value === value}
                    className={`${optionRow} ${i === active ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                  >
                    {Icon && (
                      <span className={iconBox}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 break-words">{o.label}</span>
                    {o.value === value && <Check className="size-5 shrink-0 text-brand" aria-hidden />}
                  </li>
                );
              })}
              {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">Nada encontrado.</li>}
              {action && (
                // fixa no rodapé da lista: aparece mesmo rolando ou filtrando
                <li
                  id={optionId(actionIndex)}
                  role="option"
                  aria-selected={false}
                  className={`${optionRow} sticky bottom-0 border-t border-slate-200 font-semibold text-brand dark:border-slate-800 ${active === actionIndex ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}
                  onMouseEnter={() => setActive(actionIndex)}
                  onClick={() => choose(actionIndex)}
                >
                  {ActionIcon && <ActionIcon className="size-5 shrink-0" aria-hidden />}
                  <span className="min-w-0 flex-1 break-words">{action.label(query.trim())}</span>
                </li>
              )}
            </ul>
          </div>
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
