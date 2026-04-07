import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ReportsService } from '../../services/reports';
import { DailySalesReport } from '../../models/daily-sales-report.interface';
import { SalesRangeReportData } from '../../models/sales-range-report.interface';
import { TopSellingProduct } from '../../models/top-selling-product.interface';
import { CategorySummaryReport } from '../../models/category-summary-report.interface';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './report-list.html',
  styleUrl: './report-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportList implements OnInit {
  private readonly reportsService = inject(ReportsService);

  readonly isLoadingDaily = signal(true);
  readonly isLoadingRange = signal(false);
  readonly isLoadingTopProducts = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly dailyReport = signal<DailySalesReport | null>(null);
  readonly rangeReport = signal<SalesRangeReportData | null>(null);
  readonly topProducts = signal<TopSellingProduct[]>([]);
  readonly categorySummary = signal<CategorySummaryReport | null>(null);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly todayDate = this.getTodayDateString();

  readonly dailyDateFilter = signal(this.todayDate);
  readonly rangeDateFromFilter = signal(this.todayDate);
  readonly rangeDateToFilter = signal(this.todayDate);

  readonly averageTicket = computed(() => {
    const report = this.dailyReport();

    if (!report || !report.total_sales_count) {
      return 0;
    }

    return report.total_sales_amount / report.total_sales_count;
  });

  ngOnInit(): void {
    this.loadDailyReport();
    this.loadRangeReports();
  }

  loadDailyReport(): void {
    this.isLoadingDaily.set(true);
    this.errorMessage.set(null);

    this.reportsService.getDailySalesReport(this.dailyDateFilter()).subscribe({
      next: (response) => {
        this.dailyReport.set(response.data);
        this.isLoadingDaily.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDaily.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el reporte diario.'
        );
      },
    });
  }

  loadRangeReports(targetPage = this.page()): void {
    const dateFrom = this.rangeDateFromFilter();
    const dateTo = this.rangeDateToFilter();

    if (!dateFrom || !dateTo) {
      this.errorMessage.set('Debes seleccionar fecha inicial y fecha final.');
      return;
    }

    this.errorMessage.set(null);

    this.loadSalesRange(dateFrom, dateTo, targetPage);
    this.loadTopProducts(dateFrom, dateTo);
    this.loadCategorySummary(dateFrom, dateTo);
  }

  loadSalesRange(dateFrom: string, dateTo: string, targetPage = 1): void {
    this.isLoadingRange.set(true);

    this.reportsService
      .getSalesRangeReport(dateFrom, dateTo, targetPage, this.limit())
      .subscribe({
        next: (response) => {
          this.rangeReport.set(response.data);
          this.page.set(response.meta.page);
          this.limit.set(response.meta.limit);
          this.total.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoadingRange.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingRange.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar el reporte por rango.'
          );
        },
      });
  }

  loadTopProducts(dateFrom: string, dateTo: string): void {
    this.isLoadingTopProducts.set(true);

    this.reportsService
      .getTopSellingProductsReport(dateFrom, dateTo, 5)
      .subscribe({
        next: (response) => {
          this.topProducts.set(response.data);
          this.isLoadingTopProducts.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingTopProducts.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar el top de productos.'
          );
        },
      });
  }

  loadCategorySummary(dateFrom: string, dateTo: string): void {
    this.isLoadingCategories.set(true);

    this.reportsService.getCategorySummaryReport(dateFrom, dateTo).subscribe({
      next: (response) => {
        this.categorySummary.set(response.data);
        this.isLoadingCategories.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingCategories.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el resumen por categorías.'
        );
      },
    });
  }

  applyDailyFilter(): void {
    this.loadDailyReport();
  }

  applyRangeFilters(): void {
    this.loadRangeReports(1);
  }

  refreshAll(): void {
    this.loadDailyReport();
    this.loadRangeReports(this.page());
  }

  onDailyDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dailyDateFilter.set(target.value);
  }

  onRangeDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeDateFromFilter.set(target.value);
  }

  onRangeDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeDateToFilter.set(target.value);
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadSalesRange(
      this.rangeDateFromFilter(),
      this.rangeDateToFilter(),
      this.page() - 1
    );
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadSalesRange(
      this.rangeDateFromFilter(),
      this.rangeDateToFilter(),
      this.page() + 1
    );
  }

  getPaymentStatusBadgeClass(status: string): string {
    return status === 'PAID' ? 'badge badge--success' : 'badge badge--warning';
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'TRANSFER':
        return 'Transferencia';
      default:
        return method;
    }
  }

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}