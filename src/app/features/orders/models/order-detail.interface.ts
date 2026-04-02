import { Order } from './order.interface';
import { OrderItem } from './order-item.interface';

export interface OrderDetail extends Order {
  items: OrderItem[];
}