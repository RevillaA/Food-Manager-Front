export interface AddOrderItemRequest {
  product_id: string;
  quantity: number;
  notes?: string | null;
}