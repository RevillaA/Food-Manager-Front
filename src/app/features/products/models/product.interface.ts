export interface ProductCategory {
  id: string;
  name: string;
  category_type: 'MAIN_DISH' | 'DRINK' | 'EXTRA' | string;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  category: ProductCategory;
  created_at: string;
  updated_at: string;
}