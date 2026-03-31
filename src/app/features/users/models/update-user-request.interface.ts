export interface UpdateUserRequest {
  full_name?: string;
  username?: string;
  email?: string | null;
  role_name?: 'ADMIN' | 'CASHIER';
}