import { CategoryType } from './category.interface';

export interface UpdateCategoryRequest {
  name?: string;
  category_type?: CategoryType;
  description?: string | null;
}