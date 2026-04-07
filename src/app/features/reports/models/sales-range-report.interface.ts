import { Sale } from '../../sales/models/sale.interface';

export interface SalesRangeSummary {
  date_from: string;
  date_to: string;
  total_sales_amount: number;
  total_sales_count: number;
}

export interface SalesRangeReportData {
  summary: SalesRangeSummary;
  sales: Sale[];
}

export interface SalesRangeReportResponse {
  success: boolean;
  message: string;
  data: SalesRangeReportData;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}