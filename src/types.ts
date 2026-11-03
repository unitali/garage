export type VehicleType = 'carro' | 'moto' | 'bike' | 'caminhao' | 'outro';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  plate: string;
  /** km no momento do cadastro */
  initialOdometer: number;
  /** maior km registrado (desnormalizado); com `odometerUpdatedAt`, também a leitura do "Atualizar km" */
  odometer: number;
  /** quando o km foi atualizado à mão ("Atualizar km"), em ms */
  odometerUpdatedAt?: number;
  createdAt: number;
}

export type EntryKind = 'fuel' | 'service' | 'expense';

export interface Entry {
  id: string;
  kind: EntryKind;
  /** YYYY-MM-DD */
  date: string;
  odometer: number | null;
  /** valor total em R$ */
  amount: number;
  category: string;
  description: string;
  notes: string;
  // só abastecimento
  liters?: number;
  pricePerLiter?: number;
  fuelType?: string;
  fullTank?: boolean;
  /** só serviço: título dado pelo usuário (ex: "Revisão dos 60 mil km") */
  title?: string;
  /** só serviço com vários itens feitos juntos: `amount` é a soma e `category` é o 1º item */
  items?: ServiceItem[];
  /** só despesa parcelada/recorrente: cada parcela é um registro, ligados pelo `id` */
  series?: EntrySeries;
  /** conta (despesa a vencer): false = em aberto, aparece nos lembretes do mês até marcar "Pago" */
  paid?: boolean;
  createdAt: number;
}

/** Um item de um serviço (ex: correia dentada, embreagem e bomba d'água no mesmo dia). */
export interface ServiceItem {
  category: string;
  amount: number;
}

export interface Reminder {
  id: string;
  title: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  /** km da última vez que foi feito */
  lastKm: number | null;
  /** YYYY-MM-DD da última vez que foi feito */
  lastDate: string | null;
  createdAt: number;
}

export type Data<T> = Omit<T, 'id'>;

/** Tipos de serviço/despesa criados pelo usuário, além dos padrões (constants.ts). */
export type CategoryKind = Extract<EntryKind, 'service' | 'expense'>;

/** Documento users/{uid}: preferências da conta. */
export interface UserPrefs {
  serviceCategories?: string[];
  expenseCategories?: string[];
  /** aviso de lembrete: faltando até X km ou Y meses (padrão em calc.ts DEFAULT_ALERT) */
  alertKm?: number;
  alertMonths?: number;
}

export interface EntrySeries {
  id: string;
  type: 'installments' | 'recurring';
  /** 1 … count */
  index: number;
  count: number;
}
