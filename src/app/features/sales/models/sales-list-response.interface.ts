import { Sale } from './sale.interface';

export interface SalesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SalesListResponse {
  success: boolean;
  message: string;
  data: Sale[];
  meta: SalesPaginationMeta;
}