import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { User } from '../models/user.interface';
import { UsersListResponse } from '../models/users-list-response.interface';
import { CreateUserRequest } from '../models/create-user-request.interface';
import { UpdateUserRequest } from '../models/update-user-request.interface';
import { UpdateUserStatusRequest } from '../models/update-user-status-request.interface';

interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getUsers(page = 1, limit = 10): Observable<UsersListResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<UsersListResponse>(this.baseUrl, { params });
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  createUser(payload: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, payload);
  }

  updateUserStatus(
    id: string,
    payload: UpdateUserStatusRequest
  ): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}/status`, payload);
  }
}