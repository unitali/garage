import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { Car, ChevronRight, LogOut } from 'lucide-react';
import Header from '../components/Header';
import InstallCard from '../components/InstallCard';
import { logout, useAuth } from '../auth';
import { useVehicles } from '../hooks';
import { useOnline } from '../sync';
import { btn, card, cardRow, error as errorText, field, form, hint, input, main, sectionTitle } from '../ui';
import { paths } from '../routes/paths';

export default function Profile() {
  const { user } = useAuth();
  const online = useOnline();
  const { data: vehicles } = useVehicles(user!.uid);
  const [name, setName] = useState(user?.displayName ?? '');
  // o objeto do Firebase muda por dentro sem re-renderizar: guardamos o nome salvo aqui
  const [savedName, setSavedName] = useState(user?.displayName ?? '');
  const [photoFailed, setPhotoFailed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  if (!user) return null;
  const shownName = savedName || user.email || 'Você';
  const initials = shownName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await updateProfile(user!, { displayName: name.trim() || null });
      setSavedName(name.trim());
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <>
      <Header title="Perfil" />
      <main className={`${main} flex flex-col gap-4`}>
        <section className={`${card} flex flex-col items-center gap-2 py-6 text-center`}>
          {user.photoURL && !photoFailed ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="size-20 rounded-full object-cover ring-4 ring-brand-soft"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-brand text-2xl font-bold text-brand-contrast">
              {initials}
            </span>
          )}
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
              {status === 'saving' ? 'Salvando…' : status === 'saved' ? '✓ Salvo' : 'Salvar'}
            </button>
          </form>
        </section>

        <Link className={cardRow} to={paths.home()}>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Car />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong>Meus veículos</strong>
            <span className="text-sm text-muted">
              {vehicles.length === 1 ? '1 veículo' : `${vehicles.length} veículos`}
            </span>
          </span>
          <ChevronRight className="text-muted" />
        </Link>

        <InstallCard />

        <button className={`${btn('danger')} w-full gap-2`} onClick={() => confirm('Sair da conta?') && logout()}>
          <LogOut className="size-5" />
          Sair da conta
        </button>
      </main>
    </>
  );
}
