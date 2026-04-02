import { Sale } from './sale.interface';
import { SaleItem } from './sale-item.interface';

export interface SaleDetail extends Sale {
  items: SaleItem[];
}
