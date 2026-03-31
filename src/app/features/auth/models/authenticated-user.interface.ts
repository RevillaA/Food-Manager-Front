import { Role } from './role.interface';

export interface AuthenticatedUser {
  id: string;
  full_name: string;
  username: string;
  email: string | null;
  is_active: boolean;
  role: Role;
}