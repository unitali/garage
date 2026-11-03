import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../auth';
import { useOnline } from '../sync';
import { paths } from '../routes/paths';
import { btn, card, error as errorText, field, form, hint, input, main, sectionTitle } from '../ui';

/** Configurações → Perfil: dados da conta Google e nome de exibição. */
export default function Profile() {
  const { user } = useAuth();
  const online = useOnline();
  const [name, setName] = useState(user?.displayName ?? '');
  // o objeto do Firebase muda por dentro sem re-renderizar: guardamos o nome salvo aqui
  const [savedName, setSavedName] = useState(user?.displayName ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const navigate = useNavigate();

  if (!user) return null;
  const shownName = savedName || user.email || 'Você';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await updateProfile(user!, { displayName: name.trim() || null });
      setSavedName(name.trim());
      navigate(paths.home());
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <>
      <Header title="Perfil" back={paths.more()} />
      <main className={`${main} flex flex-col gap-4`}>
        <section className={`${card} flex flex-col items-center gap-2 py-6 text-center`}>
          <UserAvatar user={user} name={shownName} className="size-20 text-2xl ring-4 ring-brand-soft" />
          <strong className="text-lg">{shownName}</strong>
          {user.email && <span className="text-sm text-muted">{user.email}</span>}
        </section>

        <section className={card}>
          <h2 className={sectionTitle}>Seus dados</h2>
          <form className={form} onSubmit={submit}>
            <label className={field}>
              Nome
              <input
                className={input}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setStatus('idle');
                }}
                placeholder="Como quer ser chamado"
                autoComplete="name"
              />
              {!online && <small className={hint}>Alterar o nome precisa de internet.</small>}
            </label>
            {status === 'error' && <p className={errorText}>Não foi possível salvar. Tente de novo.</p>}
            <button
              className={`${btn('primary')} w-full`}
              type="submit"
              disabled={!online || status === 'saving' || name.trim() === savedName}
            >
              {status === 'saving' ? 'Salvando…' : 'Salvar'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
