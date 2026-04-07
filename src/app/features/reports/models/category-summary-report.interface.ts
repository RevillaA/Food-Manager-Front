export interface CategorySummaryItem {
  category_name: string;
  total_amount: number;
  total_quantity: number;
}

export interface CategorySummaryReport {
  date_from: string;
  date_to: string;
  categories: CategorySummaryItem[];
}