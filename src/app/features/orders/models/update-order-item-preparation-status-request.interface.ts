import { OrderPreparationStatus } from './order.interface';

export interface UpdateOrderItemPreparationStatusRequest {
  preparation_status: OrderPreparationStatus;
}