import { Sale } from '../../sales/models/sale.interface';

export interface DailySalesTotalsByCategory {
  MAIN_DISH: number;
  DRINK: number;
  EXTRA: number;
}

export interface DailySalesReport {
  date: string;
  total_sales_amount: number;
  total_sales_count: number;
  totals_by_category: DailySalesTotalsByCategory;
  sales: Sale[];
}