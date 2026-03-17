export type Role = 'ADMIN' | 'PROVIDER' | 'TAKER';
export type LoanStatus = 'Active' | 'Completed' | 'Overdue' | 'Defaulter';
export type PaymentType = 'Interest' | 'Principal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive';
}

export interface Loan {
  id: string;
  providerId: string;
  takerId: string;
  name: string; // Taker Name (legacy support)
  phone: string; // Taker Phone (legacy support)
  amount: number;
  rate: number;
  startDate: string;
  type: 'Simple' | 'Compound';
  cycle: 'Monthly' | 'Daily';
  status: LoanStatus;
  notes: string;
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  type: PaymentType;
  notes: string;
}
