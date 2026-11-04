import { logout, useAuth } from '../auth';
import { deleteAccount } from '../db';
import { ask } from '../dialog';
import { clearSelectedVehicle } from '../selection';
import { btn } from '../ui';

/** Botão "Excluir conta" + confirmação. Cancelar não faz nada; confirmar guarda uma cópia, apaga tudo e sai. */
export default function DeleteAccount() {
  const { user } = useAuth();

  function remove() {
    if (!user) return;
    ask({
      title: 'Excluir conta?',
      message: (
        <>
          <p>
            <b>Tudo será excluído</b>: veículos, abastecimentos, serviços, despesas, lembretes e suas configurações.
          </p>
          <p>Os dados serão perdidos e não será possível recuperá-los pelo app. Em seguida, você sai da conta.</p>
        </>
      ),
      confirmLabel: 'Excluir tudo',
      action: async () => {
        await deleteAccount(user.uid, { email: user.email, name: user.displayName });
        clearSelectedVehicle();
        await logout();
      },
      errorText: 'Não foi possível excluir agora. Verifique a internet e tente de novo — seus dados não foram perdidos.',
    });
  }

  return (
    <button type="button" className={`${btn('destructive')} w-full`} onClick={remove}>
      Excluir conta
    </button>
  );
}
