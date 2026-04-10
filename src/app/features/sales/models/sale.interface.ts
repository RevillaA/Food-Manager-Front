export type PaymentStatus = 'PAID' | 'PENDING';
export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface SaleCreatedByUser {
  id: string;
  full_name: string;
  username: string;
}

export interface Sale {
  id: string;
  daily_session_id: string;
  order_id: string;
  sale_identifier?: string | null;
  created_by_user_id: string;
  sale_number: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  total: number;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by_user: SaleCreatedByUser;
}
