import { BellRing } from 'lucide-react';
import { OIL_KM_OPTIONS, OIL_MONTH_OPTIONS } from '../constants';
import { addMonths } from '../lib/dates';
import { date, km as kmText } from '../lib/format';
import { chip, fieldset, hint, legend } from '../ui';

/**
 * Intervalo da próxima troca de óleo: um badge de km e um de meses (obrigatórios).
 * Ao salvar o serviço, vira o lembrete "Troca de óleo" do veículo.
 */
export default function OilChangeField({
  km,
  months,
  onKm,
  onMonths,
  fromKm,
  fromDate,
}: {
  km: number | null;
  months: number | null;
  onKm: (km: number) => void;
  onMonths: (months: number) => void;
  /** km e data deste serviço: a contagem começa daqui */
  fromKm: number;
  fromDate: string;
}) {
  const done = km != null && months != null;

  return (
    <fieldset className={fieldset}>
      <legend className={legend}>Próxima troca de óleo</legend>

      <span className="text-sm font-semibold">A cada</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Intervalo em km">
        {OIL_KM_OPTIONS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={km === k} className={chip(km === k)} onClick={() => onKm(k)}>
            {kmText(k)}
          </button>
        ))}
      </div>

      <span className="mt-1 text-sm font-semibold">ou a cada</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Intervalo em meses">
        {OIL_MONTH_OPTIONS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={months === m} className={chip(months === m)} onClick={() => onMonths(m)}>
            {m} meses
          </button>
        ))}
      </div>

      {done ? (
        <p className="mt-1 flex items-start gap-2 rounded-xl bg-brand-soft p-2.5 text-sm">
          <BellRing className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            Lembrete da próxima troca: <b>{kmText(fromKm + km)}</b> ou <b>{date(addMonths(fromDate, months))}</b>, o que vier
            primeiro.
          </span>
        </p>
      ) : (
        <small className={hint}>Escolha um intervalo de km e um de meses para salvar — o lembrete é criado com eles.</small>
      )}
    </fieldset>
  );
}
