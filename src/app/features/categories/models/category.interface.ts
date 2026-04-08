export type CategoryType = 'MAIN_DISH' | 'DRINK' | 'EXTRA' | 'SWEET';

export interface Category {
  id: string;
  name: string;
  category_type: CategoryType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}