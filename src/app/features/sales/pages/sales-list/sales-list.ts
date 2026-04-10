import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { SalesService } from '../../services/sales';
import { Sale, PaymentMethod, PaymentStatus } from '../../models/sale.interface';
import { SaleDetail } from '../../models/sale-detail.interface';
import { SalesListResponse } from '../../models/sales-list-response.interface';
import { SaleDetailModal } from '../../components/sale-detail-modal/sale-detail-modal';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, SaleDetailModal],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesList implements OnInit {
  private readonly salesService = inject(SalesService);

  readonly isLoading = signal(true);
  readonly isLoadingToday = signal(true);
  readonly isLoadingDetail = signal(false);
  readonly isUpdatingPaymentStatus = signal(false);
  readonly isRefreshing = signal(false);

  readonly errorMessage = signal<string | null>(null);
  readonly detailErrorMessage = signal<string | null>(null);
  readonly paymentUpdateErrorMessage = signal<string | null>(null);

  readonly sales = signal<Sale[]>([]);
  readonly todaySales = signal<Sale[]>([]);
  readonly selectedSale = signal<SaleDetail | null>(null);

  readonly isDetailModalOpen = signal(false);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly paymentStatusFilter = signal<PaymentStatus | ''>('');
  readonly paymentMethodFilter = signal<PaymentMethod | ''>('');
  readonly selectedDayFilter = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');

  readonly todaySalesCount = computed(() => this.todaySales().length);

  readonly todaySalesTotal = computed(() => {
    return this.todaySales().reduce((sum, sale) => sum + sale.total, 0);
  });

  readonly paidTodayCount = computed(() => {
    return this.todaySales().filter((sale) => sale.payment_status === 'PAID').length;
  });

  readonly pendingTodayCount = computed(() => {
    return this.todaySales().filter((sale) => sale.payment_status === 'PENDING').length;
  });

  readonly activeFiltersCount = computed(() => {
    let count = 0;

    if (this.paymentStatusFilter()) count++;
    if (this.paymentMethodFilter()) count++;
    if (this.selectedDayFilter()) count++;
    if (!this.selectedDayFilter() && this.dateFromFilter()) count++;
    if (!this.selectedDayFilter() && this.dateToFilter()) count++;

    return count;
  });

  readonly isViewingToday = computed(() => {
    return this.selectedDayFilter() === this.getTodayString();
  });

  ngOnInit(): void {
    const today = this.getTodayString();

    // Por defecto, la lista principal muestra ventas del día actual
    this.selectedDayFilter.set(today);

    this.loadSales(1);
    this.loadSalesOfToday();
  }

  loadSales(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const selectedDay = this.selectedDayFilter();
    const dateFrom = this.dateFromFilter();
    const dateTo = this.dateToFilter();

    const handleSuccess = (response: SalesListResponse): void => {
      this.sales.set(response.data);
      this.page.set(response.meta.page);
      this.limit.set(response.meta.limit);
      this.total.set(response.meta.total);
      this.totalPages.set(response.meta.totalPages);
      this.isLoading.set(false);
      this.isRefreshing.set(false);

      const selectedId = this.selectedSale()?.id;
      if (selectedId && this.isDetailModalOpen()) {
        const exists = response.data.some((sale) => sale.id === selectedId);

        if (exists) {
          this.loadSaleDetail(selectedId, false);
        } else {
          this.closeDetailModal();
        }
      }
    };

    const handleError = (error: HttpErrorResponse): void => {
      this.isLoading.set(false);
      this.isRefreshing.set(false);
      this.errorMessage.set(
        error.error?.message || 'No se pudo cargar la lista de ventas.'
      );
    };

    if (selectedDay) {
      this.salesService
        .getSalesOfDay(targetPage, this.limit(), {
          date: selectedDay,
          payment_status: this.paymentStatusFilter() || undefined,
          payment_method: this.paymentMethodFilter() || undefined,
        })
        .subscribe({ next: handleSuccess, error: handleError });

      return;
    }

    if (dateFrom && dateTo) {
      this.salesService
        .getSalesByRange(targetPage, this.limit(), {
          date_from: dateFrom,
          date_to: dateTo,
          payment_status: this.paymentStatusFilter() || undefined,
          payment_method: this.paymentMethodFilter() || undefined,
        })
        .subscribe({ next: handleSuccess, error: handleError });

      return;
    }

    const today = this.getTodayString();

    this.salesService
      .getSalesOfDay(targetPage, this.limit(), {
        date: today,
        payment_status: this.paymentStatusFilter() || undefined,
        payment_method: this.paymentMethodFilter() || undefined,
      })
      .subscribe({ next: handleSuccess, error: handleError });
  }

  loadSalesOfToday(): void {
    this.isLoadingToday.set(true);

    this.salesService.getSalesOfDay(1, 100, { date: this.getTodayString() }).subscribe({
      next: (response) => {
        this.todaySales.set(response.data);
        this.isLoadingToday.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingToday.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudieron cargar las ventas del día.'
        );
      },
    });
  }

  openSaleDetail(saleId: string): void {
    this.isDetailModalOpen.set(true);
    this.loadSaleDetail(saleId, true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedSale.set(null);
    this.detailErrorMessage.set(null);
    this.paymentUpdateErrorMessage.set(null);
    this.isUpdatingPaymentStatus.set(false);
  }

  loadSaleDetail(saleId: string, clearPrevious = true): void {
    this.isLoadingDetail.set(true);
    this.detailErrorMessage.set(null);
    this.paymentUpdateErrorMessage.set(null);

    if (clearPrevious) {
      this.selectedSale.set(null);
    }

    this.salesService.getSaleById(saleId).subscribe({
      next: (response) => {
        this.selectedSale.set(response.data);
        this.isLoadingDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDetail.set(false);
        this.detailErrorMessage.set(
          error.error?.message || 'No se pudo cargar el detalle de la venta.'
        );
      },
    });
  }

  markSelectedSaleAsPaid(): void {
    const sale = this.selectedSale();

    if (!sale || sale.payment_status !== 'PENDING') {
      return;
    }

    this.isUpdatingPaymentStatus.set(true);
    this.paymentUpdateErrorMessage.set(null);

    this.salesService.updateSalePaymentStatus(sale.id, 'PAID').subscribe({
      next: (response) => {
        this.selectedSale.set(response.data);
        this.isUpdatingPaymentStatus.set(false);
        this.closeDetailModal();
        this.loadSales(this.page());
        this.loadSalesOfToday();
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdatingPaymentStatus.set(false);
        this.paymentUpdateErrorMessage.set(
          error.error?.message || 'No se pudo actualizar el estado de la venta.'
        );
      },
    });
  }

  onPaymentStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paymentStatusFilter.set(target.value as PaymentStatus | '');
    this.loadSales(1);
  }

  onPaymentMethodFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paymentMethodFilter.set(target.value as PaymentMethod | '');
    this.loadSales(1);
  }

  onSelectedDayChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    this.selectedDayFilter.set(value);

    if (value) {
      // Si selecciona un día específico, se limpian los campos de rango
      this.dateFromFilter.set('');
      this.dateToFilter.set('');
    }

    this.loadSales(1);
  }

  onDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    this.dateFromFilter.set(value);

    if (value) {
      // Si usa rango, se limpia el día específico
      this.selectedDayFilter.set('');

      if (!this.dateToFilter()) {
        this.dateToFilter.set(value);
      }
    }

    this.loadSales(1);
  }

  onDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    this.dateToFilter.set(value);

    if (value) {
      // Si usa rango, se limpia el día específico
      this.selectedDayFilter.set('');

      if (!this.dateFromFilter()) {
        this.dateFromFilter.set(value);
      }
    }

    this.loadSales(1);
  }

  showTodaySales(): void {
    const today = this.getTodayString();

    this.selectedDayFilter.set(today);
    this.dateFromFilter.set('');
    this.dateToFilter.set('');
    this.loadSales(1);
  }

  clearFilters(): void {
    // Vuelve al comportamiento base: mostrar ventas de hoy
    const today = this.getTodayString();

    this.paymentStatusFilter.set('');
    this.paymentMethodFilter.set('');
    this.selectedDayFilter.set(today);
    this.dateFromFilter.set('');
    this.dateToFilter.set('');

    this.loadSales(1);
  }

  refreshAll(): void {
    this.isRefreshing.set(true);
    this.loadSales(this.page());
    this.loadSalesOfToday();
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadSales(this.page() - 1);
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadSales(this.page() + 1);
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Pagada';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
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

  getSaleDisplayIdentifier(sale: Sale): string {
    const formattedDate = this.getCompactDate(sale.created_at);
    const paddedSaleNumber = String(sale.sale_number).padStart(3, '0');

    return `VENTA-${paddedSaleNumber}-${formattedDate}`;
  }

  getSaleInitial(saleNumber: number | string): string {
    return String(saleNumber).charAt(0).toUpperCase();
  }

  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getCompactDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '00000000';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }
}
