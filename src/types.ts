export type VehicleType = 'carro' | 'moto' | 'bike' | 'caminhao' | 'outro';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  plate: string;
  /** km no momento do cadastro */
  initialOdometer: number;
  /** maior km registrado (desnormalizado para a lista de veículos) */
  odometer: number;
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
  createdAt: number;
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
}
