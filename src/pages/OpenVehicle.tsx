import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paths, type VehicleTab } from '../routes/paths';
import { selectVehicle } from '../selection';

const TARGET: Record<VehicleTab, () => string> = {
  resumo: paths.home,
  historico: () => paths.history(),
  despesas: () => paths.history('despesa'),
  lembretes: paths.reminders,
};

/** /v/:vid — seleciona o veículo e abre a tela pedida (os formulários voltam por aqui). */
export default function OpenVehicle() {
  const { vid } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tab = params.get('tab') as VehicleTab | null;

  useEffect(() => {
    if (vid) selectVehicle(vid);
    navigate((tab && TARGET[tab] ? TARGET[tab] : paths.home)(), { replace: true });
  }, [vid, tab, navigate]);

  return null;
}
