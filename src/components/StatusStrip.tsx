import { useEffect, useState } from 'react';
import { applyUpdate, useUpdateAvailable } from '../pwa';
import { trackPendingFromLastSession, useOnline, usePendingWrites } from '../sync';

const strip = 'flex items-center justify-between gap-2 border-b border-line px-4 py-1.5 text-sm font-semibold';

/** Faixas abaixo da barra do topo: nova versão, sem conexão e sincronização. */
export default function StatusStrip() {
  const update = useUpdateAvailable();
  const online = useOnline();
  const pending = usePendingWrites();
  // só mostra "enviando/enviado" para o que ficou esperando a rede — gravações online são instantâneas
  const [waited, setWaited] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(trackPendingFromLastSession, []);

  useEffect(() => {
    if (pending && !online) setWaited(true);
    if (!pending && waited) {
      setWaited(false);
      setSynced(true);
    }
  }, [pending, online, waited]);

  useEffect(() => {
    if (!synced) return;
    const t = setTimeout(() => setSynced(false), 3000);
    return () => clearTimeout(t);
  }, [synced]);

  let sync: string | null = null;
  if (!online) sync = pending ? 'Sem conexão · alterações salvas no aparelho' : 'Sem conexão · você pode continuar usando';
  else if (pending && waited) sync = 'Enviando alterações…';
  else if (synced) sync = '✓ Alterações enviadas';

  return (
    <>
      {update && (
        <div className={`${strip} bg-brand-soft`}>
          <span>Nova versão disponível</span>
          <button className="px-1 py-0.5 font-semibold text-brand" onClick={applyUpdate}>
            Atualizar
          </button>
        </div>
      )}
      {sync && <div className={`${strip} bg-surface ${online ? 'text-ok' : 'text-warn'}`}>{sync}</div>}
    </>
  );
}
