import { CategoryType } from './category.interface';

export interface CreateCategoryRequest {
  name: string;
  category_type: CategoryType;
  description?: string | null;
}