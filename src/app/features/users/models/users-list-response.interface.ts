import { User } from './user.interface';

export interface UsersPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: UsersPaginationMeta;
}