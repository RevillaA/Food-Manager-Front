import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Category, CategoryType } from '../models/category.interface';
import { CategoriesListResponse } from '../models/categories-list-response.interface';
import { CreateCategoryRequest } from '../models/create-category-request.interface';
import { UpdateCategoryRequest } from '../models/update-category-request.interface';
import { UpdateCategoryStatusRequest } from '../models/update-category-status-request.interface';

interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  getCategories(
    page = 1,
    limit = 10,
    filters?: {
      is_active?: boolean;
      category_type?: CategoryType;
    }
  ): Observable<CategoriesListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (typeof filters?.is_active === 'boolean') {
      params = params.set('is_active', String(filters.is_active));
    }

    if (filters?.category_type) {
      params = params.set('category_type', filters.category_type);
    }

    return this.http.get<CategoriesListResponse>(this.baseUrl, { params });
  }

  getCategoryById(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/${id}`);
  }

  createCategory(payload: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.baseUrl, payload);
  }

  updateCategory(
    id: string,
    payload: UpdateCategoryRequest
  ): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${this.baseUrl}/${id}`, payload);
  }

  updateCategoryStatus(
    id: string,
    payload: UpdateCategoryStatusRequest
  ): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${this.baseUrl}/${id}/status`, payload);
  }
}