import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Select from './Select';
import { addCategory } from '../db';
import { useUserPrefs } from '../hooks';
import { DEFAULT_CATEGORIES, categoryOptions, normalizeCategory } from '../constants';
import type { CategoryKind } from '../types';
import { btn, input } from '../ui';

const NOUN: Record<CategoryKind, { add: string; placeholder: string }> = {
  service: { add: 'Adicionar serviço…', placeholder: 'Ex: Troca de pastilhas' },
  expense: { add: 'Adicionar despesa…', placeholder: 'Ex: Rastreador' },
};

/**
 * Select de tipo de serviço/despesa com a opção de criar um novo, que fica salvo na conta
 * (users/{uid}) e aparece nas próximas vezes, em qualquer veículo.
 */
export default function CategorySelect({
  uid,
  kind,
  value,
  onChange,
  label = 'Categoria',
  compact = false,
}: {
  uid: string;
  kind: CategoryKind;
  /** '' = nada escolhido ainda ("Selecione…") */
  value: string;
  onChange: (category: string) => void;
  label?: string;
  /** dentro de um grid (linha "item + valor"): rótulo só para leitor de tela */
  compact?: boolean;
}) {
  const prefs = useUserPrefs(uid);
  const custom = (kind === 'service' ? prefs.data?.serviceCategories : prefs.data?.expenseCategories) ?? [];
  const options = categoryOptions(DEFAULT_CATEGORIES[kind], custom, value || undefined);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function cancel() {
    setAdding(false);
    setName('');
  }

  function confirm() {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    // já existe (com outra grafia)? só seleciona
    const existing = options.find((o) => normalizeCategory(o) === normalizeCategory(clean));
    if (!existing) addCategory(uid, kind, clean);
    onChange(existing ?? clean);
    cancel();
  }

  const select = (
    <Select
      value={value}
      options={options.map((c) => ({ value: c, label: c }))}
      onChange={onChange}
      searchable
      // sempre visível no rodapé; com algo buscado que não existe, já vem com o nome preenchido
      action={{
        label: (q) => (q && !options.some((o) => normalizeCategory(o) === normalizeCategory(q)) ? `Adicionar "${q}"` : NOUN[kind].add),
        icon: Plus,
        onSelect: (q) => {
          setName(q);
          setAdding(true);
        },
      }}
      label={compact ? undefined : label}
      ariaLabel={compact ? label : undefined}
      compact={compact}
    />
  );

  const addRow = adding && (
    // compacto: ocupa a linha inteira do grid do pai, abaixo dos campos
    <div className={`flex gap-2 ${compact ? 'order-last col-span-full' : ''}`}>
      <input
        className={`${input} min-w-0`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          // Enter cria o tipo em vez de salvar o formulário
          if (e.key === 'Enter') {
            e.preventDefault();
            confirm();
          }
          if (e.key === 'Escape') cancel();
        }}
        placeholder={NOUN[kind].placeholder}
        maxLength={40}
        autoFocus
        aria-label={kind === 'service' ? 'Nome do novo serviço' : 'Nome da nova despesa'}
      />
      <button type="button" className={btn('primary')} onClick={confirm} disabled={!name.trim()}>
        Adicionar
      </button>
      <button type="button" className={btn()} onClick={cancel} aria-label="Cancelar">
        <X className="size-5" />
      </button>
    </div>
  );

  // compacto: sem rótulo visível e sem contêiner — select e linha de criar viram itens do grid do pai
  if (compact)
    return (
      <>
        {select}
        {addRow}
      </>
    );

  return (
    <div className="flex flex-col gap-1.5">
      {select}
      {addRow}
    </div>
  );
}
