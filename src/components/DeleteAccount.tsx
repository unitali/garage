import { deleteUser } from 'firebase/auth';
import { confirmIdentity, useAuth, useResumeAfterReauth } from '../auth';
import { deleteAccount } from '../db';
import { ask, UserFacingError } from '../dialog';
import { btn } from '../ui';

const INTENT = 'delete-account';

/**
 * Botão "Excluir conta" + confirmação. Cancelar não faz nada; confirmar pede a conta Google de novo
 * (se o login não for recente), guarda uma cópia, apaga os dados e o login do Firebase Auth. Sem o
 * usuário, o AuthProvider apaga o cache do aparelho e volta para a tela de entrada.
 */
export default function DeleteAccount() {
  const { user } = useAuth();
  useResumeAfterReauth(user ? INTENT : null, remove);

  function remove() {
    if (!user) return;
    ask({
      title: 'Excluir conta?',
      message: (
        <>
          <p>
            <b>Tudo será excluído</b>: veículos, abastecimentos, serviços, despesas, lembretes, suas configurações e o seu
            acesso ao app.
          </p>
          <p>Os dados serão perdidos e não será possível recuperá-los pelo app. Para confirmar, escolha sua conta Google.</p>
        </>
      ),
      confirmLabel: 'Excluir tudo',
      action: async () => {
        await confirmIdentity(INTENT);
        await deleteAccount(user.uid, { email: user.email, name: user.displayName });
        try {
          await deleteUser(user);
        } catch {
          throw new UserFacingError('Seus dados foram excluídos, mas não foi possível remover o acesso. Toque de novo para concluir.');
        }
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
