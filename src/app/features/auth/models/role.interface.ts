export interface Role {
  id: string;
  name: 'ADMIN' | 'CASHIER' | string;
  description: string | null;
}