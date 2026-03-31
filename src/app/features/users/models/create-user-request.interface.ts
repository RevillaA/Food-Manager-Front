export interface CreateUserRequest {
  full_name: string;
  username: string;
  email?: string | null;
  password: string;
  role_name: 'ADMIN' | 'CASHIER';
}