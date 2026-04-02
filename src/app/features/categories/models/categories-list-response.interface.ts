import { Category } from './category.interface';

export interface CategoriesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoriesListResponse {
  success: boolean;
  message: string;
  data: Category[];
  meta: CategoriesPaginationMeta;
}