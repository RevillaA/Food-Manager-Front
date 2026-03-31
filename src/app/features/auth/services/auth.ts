import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { LoginRequest } from '../models/login-request.interface';
import {
  LoginResponse,
  LoginResponseData,
} from '../models/login-response.interface';
import { AuthenticatedUser } from '../models/authenticated-user.interface';

import { TokenService } from '../../../core/services/token';
import { SessionService } from '../../../core/services/session';

interface MeResponse {
  success: boolean;
  message: string;
  data: AuthenticatedUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly sessionService = inject(SessionService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      map((response) => this.extractLoginData(response)),
      tap((data) => this.persistAuth(data)),
      map((data) => data.user),
      catchError((error) => {
        this.sessionService.clearSession();
        return throwError(() => error);
      })
    );
  }

  getMe(): Observable<AuthenticatedUser> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
      map((response) => response.data),
      tap((user) => {
        this.sessionService.setUser(user);
      }),
      catchError((error) => {
        this.sessionService.clearSession();
        return throwError(() => error);
      })
    );
  }

  restoreSession(): Observable<AuthenticatedUser | null> {
    if (!this.tokenService.hasToken()) {
      this.sessionService.clearSession();
      return of(null);
    }

    return this.getMe().pipe(
      catchError(() => {
        this.sessionService.clearSession();
        return of(null);
      })
    );
  }

  logout(): void {
    this.sessionService.clearSession();
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.sessionService.getUser();
  }

  private extractLoginData(response: LoginResponse): LoginResponseData {
    if (!response?.success || !response?.data?.token || !response?.data?.user) {
      throw new Error('Invalid login response structure');
    }

    return response.data;
  }

  private persistAuth(data: LoginResponseData): void {
    this.tokenService.setToken(data.token);
    this.sessionService.setUser(data.user);
  }
}