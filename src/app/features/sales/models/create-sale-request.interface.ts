import { PaymentMethod, PaymentStatus } from './sale.interface';

export interface CreateSaleRequest {
  order_id: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string | null;
}