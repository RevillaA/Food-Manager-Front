export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type OrderPreparationStatus = 'IN_PROGRESS' | 'SERVED';

export interface OrderCreatedByUser {
  id: string;
  full_name: string;
  username: string;
}

export interface Order {
  id: string;
  daily_session_id: string;
  created_by_user_id: string;
  order_number: number;
  status: OrderStatus;
  preparation_status: OrderPreparationStatus;
  subtotal: number;
  notes: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_user: OrderCreatedByUser;
}