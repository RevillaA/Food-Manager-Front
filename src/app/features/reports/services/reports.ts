import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DailySalesReport } from '../models/daily-sales-report.interface';
import { SalesRangeReportResponse } from '../models/sales-range-report.interface';
import { TopSellingProduct } from '../models/top-selling-product.interface';
import { CategorySummaryReport } from '../models/category-summary-report.interface';

interface DailySalesReportResponse {
  success: boolean;
  message: string;
  data: DailySalesReport;
}

interface TopSellingProductsResponse {
  success: boolean;
  message: string;
  data: TopSellingProduct[];
}

interface CategorySummaryReportResponse {
  success: boolean;
  message: string;
  data: CategorySummaryReport;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  getDailySalesReport(date?: string): Observable<DailySalesReportResponse> {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<DailySalesReportResponse>(`${this.baseUrl}/sales/day`, {
      params,
    });
  }

  getSalesRangeReport(
    dateFrom: string,
    dateTo: string,
    page = 1,
    limit = 10
  ): Observable<SalesRangeReportResponse> {
    const params = new HttpParams()
      .set('date_from', dateFrom)
      .set('date_to', dateTo)
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<SalesRangeReportResponse>(`${this.baseUrl}/sales/range`, {
      params,
    });
  }

  getTopSellingProductsReport(
    dateFrom: string,
    dateTo: string,
    limit = 5
  ): Observable<TopSellingProductsResponse> {
    const params = new HttpParams()
      .set('date_from', dateFrom)
      .set('date_to', dateTo)
      .set('limit', String(limit));

    return this.http.get<TopSellingProductsResponse>(`${this.baseUrl}/products/top`, {
      params,
    });
  }

  getCategorySummaryReport(
    dateFrom: string,
    dateTo: string
  ): Observable<CategorySummaryReportResponse> {
    const params = new HttpParams()
      .set('date_from', dateFrom)
      .set('date_to', dateTo);

    return this.http.get<CategorySummaryReportResponse>(
      `${this.baseUrl}/categories/summary`,
      { params }
    );
  }
}