import { Injectable, signal } from '@angular/core';
import { AuthenticatedUser } from '../../features/auth/models/authenticated-user.interface';
import { TokenService } from './token';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly USER_KEY = 'authenticated_user';

  readonly currentUser = signal<AuthenticatedUser | null>(this.getStoredUser());

  constructor(private readonly tokenService: TokenService) {}

  setUser(user: AuthenticatedUser): void {
    this.currentUser.set(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): AuthenticatedUser | null {
    return this.currentUser();
  }

  clearUser(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.USER_KEY);
  }

  hasUser(): boolean {
    return this.getUser() !== null;
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken() && this.hasUser();
  }

  clearSession(): void {
    this.tokenService.clear();
    this.clearUser();
  }

  private getStoredUser(): AuthenticatedUser | null {
    const rawUser = localStorage.getItem(this.USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }
}