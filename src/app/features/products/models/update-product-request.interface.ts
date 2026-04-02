export interface UpdateProductRequest {
  category_id?: string;
  name?: string;
  description?: string | null;
  base_price?: number;
}