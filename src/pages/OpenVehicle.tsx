import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paths, type VehicleTab } from '../routes/paths';
import { selectVehicle } from '../selection';

/** /v/:vid — seleciona o veículo e abre a tela inicial na aba pedida (os formulários voltam por aqui). */
export default function OpenVehicle() {
  const { vid } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tab = (params.get('tab') as VehicleTab | null) ?? undefined;

  useEffect(() => {
    if (vid) selectVehicle(vid);
    navigate(paths.home(tab), { replace: true });
  }, [vid, tab, navigate]);

  return null;
}
