import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { SettingsGroup } from '../components/SettingsGroup';
import { useUid } from '../auth';
import { addCategory, removeCategory } from '../db';
import { useUserPrefs } from '../hooks';
import { DEFAULT_CATEGORIES, categoryOptions, normalizeCategory } from '../constants';
import { CATEGORY_SLUG, paths } from '../routes/paths';
import type { CategoryKind } from '../types';
import { btn, input, main } from '../ui';
import { ask } from '../dialog';

const META: Record<CategoryKind, { title: string; one: string; placeholder: string }> = {
  service: { title: 'Serviços', one: 'um serviço', placeholder: 'Novo serviço' },
  expense: { title: 'Despesas', one: 'uma despesa', placeholder: 'Nova despesa' },
};

/** Mais → Serviços / Despesas: tipos criados pelo usuário (os padrões só aparecem listados embaixo). */
export default function Categories() {
  const uid = useUid();
  const prefs = useUserPrefs(uid);
  const { tipo } = useParams();
  const kind = (Object.keys(CATEGORY_SLUG) as CategoryKind[]).find((k) => CATEGORY_SLUG[k] === tipo);
  if (!kind) return <Navigate to={paths.more()} replace />;
  const meta = META[kind];

  return (
    <>
      <Header title={meta.title} back={paths.more()} />
      <main className={`${main} flex flex-col gap-5`}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tipos que você criou, além dos padrões. Aparecem na lista de categoria ao registrar {meta.one}, em todos os
          veículos. Remover um tipo não altera os registros que já usam ele.
        </p>
        <Group
          key={kind}
          uid={uid}
          kind={kind}
          placeholder={meta.placeholder}
          items={(kind === 'service' ? prefs.data?.serviceCategories : prefs.data?.expenseCategories) ?? []}
        />
      </main>
    </>
  );
}

function Group({
  uid,
  kind,
  placeholder,
  items,
}: {
  uid: string;
  kind: CategoryKind;
  placeholder: string;
  items: string[];
}) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const sorted = [...items].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const defaults = DEFAULT_CATEGORIES[kind].filter((c) => c !== 'Outro');

  function add() {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    // já existe (padrão ou criado antes, com qualquer grafia)? avisa em vez de sumir sem gravar
    const match = categoryOptions(DEFAULT_CATEGORIES[kind], items).find((o) => normalizeCategory(o) === normalizeCategory(clean));
    if (match) {
      setMessage({
        ok: false,
        text: DEFAULT_CATEGORIES[kind].includes(match) ? `"${match}" já faz parte da lista padrão.` : `"${match}" já está na sua lista.`,
      });
      return;
    }
    addCategory(uid, kind, clean);
    setName('');
    setMessage({ ok: true, text: `"${clean}" adicionado.` });
  }

  return (
    <SettingsGroup>
      {sorted.length === 0 && <li className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">Nenhum ainda.</li>}
      {sorted.map((c) => (
        <li key={c} className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex-1">{c}</span>
          <button
            className="grid size-9 place-items-center rounded-lg text-red-700 dark:text-red-400 active:bg-slate-100 dark:active:bg-slate-950"
            aria-label={`Remover ${c}`}
            onClick={async () => {
              const ok = await ask({
                title: `Remover "${c}"?`,
                message: 'Sai da lista de opções. Os registros que já usam esse tipo continuam com ele.',
                confirmLabel: 'Remover',
              });
              if (ok) removeCategory(uid, kind, c);
            }}
          >
            <Trash2 className="size-5" />
          </button>
        </li>
      ))}
      <li className="flex gap-2 p-3">
        <input
          className={input}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setMessage(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          maxLength={40}
          aria-label={placeholder}
        />
        <button className={btn('primary')} onClick={add} disabled={!name.trim()} aria-label="Adicionar">
          <Plus className="size-5" />
        </button>
      </li>
      {message && (
        <li className={`px-4 pb-3 text-sm ${message.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`} role="status">
          {message.text}
        </li>
      )}
      <li className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
        <b>Já incluídos:</b> {defaults.join(', ')}.
      </li>
    </SettingsGroup>
  );
}
