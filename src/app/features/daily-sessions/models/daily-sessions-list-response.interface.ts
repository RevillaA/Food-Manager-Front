import { DailySession } from './daily-session.interface';

export interface DailySessionsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DailySessionsListResponse {
  success: boolean;
  message: string;
  data: DailySession[];
  meta: DailySessionsPaginationMeta;
}