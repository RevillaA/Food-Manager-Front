export type DailySessionStatus = 'OPEN' | 'CLOSED';

export interface DailySessionUser {
  id: string;
  full_name: string;
  username: string;
}

export interface DailySession {
  id: string;
  session_date: string;
  status: DailySessionStatus;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  opened_by_user: DailySessionUser;
  closed_by_user: DailySessionUser | null;
  created_at: string;
  updated_at: string;
}