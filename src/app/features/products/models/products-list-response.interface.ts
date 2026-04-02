import { Product } from './product.interface';

export interface ProductsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsListResponse {
  success: boolean;
  message: string;
  data: Product[];
  meta: ProductsPaginationMeta;
}