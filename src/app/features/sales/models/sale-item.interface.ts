export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  product_category_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}