import { Order } from './order.interface';

export interface OrdersPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersListResponse {
  success: boolean;
  message: string;
  data: Order[];
  meta: OrdersPaginationMeta;
}