import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Product } from '../models/product.interface';
import { ProductsListResponse } from '../models/products-list-response.interface';
import { CreateProductRequest } from '../models/create-product-request.interface';
import { UpdateProductRequest } from '../models/update-product-request.interface';
import { UpdateProductStatusRequest } from '../models/update-product-status-request.interface';

interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  getProducts(
    page = 1,
    limit = 10,
    filters?: {
      is_active?: boolean;
      category_id?: string;
    }
  ): Observable<ProductsListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (typeof filters?.is_active === 'boolean') {
      params = params.set('is_active', String(filters.is_active));
    }

    if (filters?.category_id) {
      params = params.set('category_id', filters.category_id);
    }

    return this.http.get<ProductsListResponse>(this.baseUrl, { params });
  }

  getProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${id}`);
  }

  createProduct(payload: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, payload);
  }

  updateProduct(id: string, payload: UpdateProductRequest): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.baseUrl}/${id}`, payload);
  }

  updateProductStatus(
    id: string,
    payload: UpdateProductStatusRequest
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.baseUrl}/${id}/status`, payload);
  }
}