import { useState } from 'react';
import { X } from 'lucide-react';
import { addCategory } from '../db';
import { useUserPrefs } from '../hooks';
import { DEFAULT_CATEGORIES, categoryOptions, normalizeCategory } from '../constants';
import type { CategoryKind } from '../types';
import { btn, field, input } from '../ui';

const ADD = '__add__';

const NOUN: Record<CategoryKind, { add: string; placeholder: string }> = {
  service: { add: '+ Adicionar serviço…', placeholder: 'Ex: Troca de pastilhas' },
  expense: { add: '+ Adicionar despesa…', placeholder: 'Ex: Rastreador' },
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
}: {
  uid: string;
  kind: CategoryKind;
  /** '' = nada escolhido ainda ("Selecione…") */
  value: string;
  onChange: (category: string) => void;
  label?: string;
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

  return (
    <div className="flex flex-col gap-1.5">
      <label className={field}>
        {label}
        <select
          className={input}
          value={value}
          onChange={(e) => (e.target.value === ADD ? setAdding(true) : onChange(e.target.value))}
        >
          {value === '' && (
            <option value="" disabled>
              Selecione…
            </option>
          )}
          {options.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value={ADD}>{NOUN[kind].add}</option>
        </select>
      </label>

      {adding && (
        <div className="flex gap-2">
          <input
            className={input}
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
      )}
    </div>
  );
}
