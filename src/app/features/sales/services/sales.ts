import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateSaleRequest } from '../models/create-sale-request.interface';
import { Sale } from '../models/sale.interface';
import { SaleDetail } from '../models/sale-detail.interface';
import { SalesListResponse } from '../models/sales-list-response.interface';

interface SaleResponse {
  success: boolean;
  message: string;
  data: SaleDetail;
}

interface SalesOfDayResponse {
  success: boolean;
  message: string;
  data: Sale[];
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  createSale(payload: CreateSaleRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(this.baseUrl, payload);
  }

  getSales(
    page = 1,
    limit = 10,
    filters?: {
      daily_session_id?: string;
      payment_status?: 'PAID' | 'PENDING';
      payment_method?: 'CASH' | 'TRANSFER';
      date_from?: string;
      date_to?: string;
    }
  ): Observable<SalesListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filters?.daily_session_id) {
      params = params.set('daily_session_id', filters.daily_session_id);
    }

    if (filters?.payment_status) {
      params = params.set('payment_status', filters.payment_status);
    }

    if (filters?.payment_method) {
      params = params.set('payment_method', filters.payment_method);
    }

    if (filters?.date_from) {
      params = params.set('date_from', filters.date_from);
    }

    if (filters?.date_to) {
      params = params.set('date_to', filters.date_to);
    }

    return this.http.get<SalesListResponse>(this.baseUrl, { params });
  }

  getSaleById(id: string): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.baseUrl}/${id}`);
  }

  getSalesOfToday(): Observable<SalesOfDayResponse> {
    return this.http.get<SalesOfDayResponse>(`${this.baseUrl}/day`);
  }
}