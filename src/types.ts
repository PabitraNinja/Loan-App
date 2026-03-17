export type LoanStatus = 'Active' | 'Completed' | 'Overdue' | 'Defaulter';
export type PaymentType = 'Interest' | 'Principal';

export interface Loan {
  id: string;
  name: string;
  phone: string;
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
