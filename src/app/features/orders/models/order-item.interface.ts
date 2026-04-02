import { OrderPreparationStatus } from './order.interface';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  preparation_status: OrderPreparationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}