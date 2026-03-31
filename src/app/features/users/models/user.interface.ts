export interface UserRole {
  id: string;
  name: 'ADMIN' | 'CASHIER' | string;
  description: string | null;
}

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string | null;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}