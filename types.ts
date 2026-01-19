
export enum TransactionType {
  INCOME = 'ENTRATA',
  EXPENSE = 'USCITA'
}

export enum SourceType {
  ENDU = 'ENDU',
  CASH = 'CONTANTI/PERSONALE'
}

export interface Edition {
  id: string;
  year: string;
  name: string;
}

export interface Transaction {
  id: string;
  editionId: string;
  date: string;
  type: TransactionType;
  source: SourceType;
  person: string;
  description: string;
  amount: number;
}

export interface Participant {
  id: string;
  editionId: string;
  nome: string;
  cognome: string;
  citta: string;
  cellulare: string;
  quota: string;
  taglia: string;
  pickup: string;
  tappaPullman: string;
  pranzo: boolean;
  notteHotel: boolean;
  ebike: boolean;
  note: string;
  pagato: number;
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  enduIncome: number;
  cashIncome: number;
  totalEbikes: number;
}
