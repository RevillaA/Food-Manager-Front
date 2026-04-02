import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DailySession, DailySessionStatus } from '../models/daily-session.interface';
import { DailySessionsListResponse } from '../models/daily-sessions-list-response.interface';
import { OpenDailySessionRequest } from '../models/open-daily-session-request.interface';
import { CloseDailySessionRequest } from '../models/close-daily-session-request.interface';
import { UpdateDailySessionStatusRequest } from '../models/update-daily-session-status-request.interface';

interface DailySessionResponse {
  success: boolean;
  message: string;
  data: DailySession;
}

@Injectable({
  providedIn: 'root',
})
export class DailySessionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/daily-sessions`;

  openDailySession(payload: OpenDailySessionRequest): Observable<DailySessionResponse> {
    return this.http.post<DailySessionResponse>(`${this.baseUrl}/open`, payload);
  }

  getActiveDailySession(): Observable<DailySessionResponse> {
    return this.http.get<DailySessionResponse>(`${this.baseUrl}/active`);
  }

  getDailySessions(
    page = 1,
    limit = 10,
    filters?: {
      status?: DailySessionStatus;
      session_date?: string;
    }
  ): Observable<DailySessionsListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.session_date) {
      params = params.set('session_date', filters.session_date);
    }

    return this.http.get<DailySessionsListResponse>(this.baseUrl, { params });
  }

  getDailySessionById(id: string): Observable<DailySessionResponse> {
    return this.http.get<DailySessionResponse>(`${this.baseUrl}/${id}`);
  }

  closeDailySession(
    id: string,
    payload: CloseDailySessionRequest
  ): Observable<DailySessionResponse> {
    return this.http.patch<DailySessionResponse>(`${this.baseUrl}/${id}/close`, payload);
  }

  updateDailySessionStatus(
    id: string,
    payload: UpdateDailySessionStatusRequest
  ): Observable<DailySessionResponse> {
    return this.http.patch<DailySessionResponse>(`${this.baseUrl}/${id}/status`, payload);
  }
}