import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { SettingsGroup } from '../components/SettingsGroup';
import { useUid } from '../auth';
import { addCategory, removeCategory } from '../db';
import { useUserPrefs } from '../hooks';
import { DEFAULT_CATEGORIES, categoryOptions, normalizeCategory } from '../constants';
import { paths } from '../routes/paths';
import type { CategoryKind } from '../types';
import { btn, input, main } from '../ui';

const GROUPS: { kind: CategoryKind; title: string; placeholder: string }[] = [
  { kind: 'service', title: 'Serviços personalizados', placeholder: 'Novo serviço' },
  { kind: 'expense', title: 'Despesas personalizadas', placeholder: 'Nova despesa' },
];

/** Configurações → Serviços e despesas: tipos criados pelo usuário (os padrões não aparecem aqui). */
export default function Categories() {
  const uid = useUid();
  const prefs = useUserPrefs(uid);

  return (
    <>
      <Header title="Serviços e despesas" back={paths.settings()} />
      <main className={`${main} flex flex-col gap-5`}>
        <p className="text-sm text-muted">
          Tipos que você criou, além dos padrões. Aparecem na lista de categoria ao registrar um serviço ou uma despesa, em
          todos os veículos. Remover um tipo não altera os registros que já usam ele.
        </p>
        {GROUPS.map((g) => (
          <Group
            key={g.kind}
            uid={uid}
            {...g}
            items={(g.kind === 'service' ? prefs.data?.serviceCategories : prefs.data?.expenseCategories) ?? []}
          />
        ))}
      </main>
    </>
  );
}

function Group({
  uid,
  kind,
  title,
  placeholder,
  items,
}: {
  uid: string;
  kind: CategoryKind;
  title: string;
  placeholder: string;
  items: string[];
}) {
  const [name, setName] = useState('');
  const sorted = [...items].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  function add() {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    const exists = categoryOptions(DEFAULT_CATEGORIES[kind], items).some((o) => normalizeCategory(o) === normalizeCategory(clean));
    if (!exists) addCategory(uid, kind, clean);
    setName('');
  }

  return (
    <SettingsGroup title={title}>
      {sorted.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nenhum ainda.</li>}
      {sorted.map((c) => (
        <li key={c} className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex-1">{c}</span>
          <button
            className="grid size-9 place-items-center rounded-lg text-danger active:bg-bg"
            aria-label={`Remover ${c}`}
            onClick={() => confirm(`Remover "${c}" da lista?`) && removeCategory(uid, kind, c)}
          >
            <Trash2 className="size-5" />
          </button>
        </li>
      ))}
      <li className="flex gap-2 p-3">
        <input
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          maxLength={40}
          aria-label={placeholder}
        />
        <button className={btn('primary')} onClick={add} disabled={!name.trim()} aria-label="Adicionar">
          <Plus className="size-5" />
        </button>
      </li>
    </SettingsGroup>
  );
}
