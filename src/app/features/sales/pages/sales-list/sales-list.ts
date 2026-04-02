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

import { SalesService } from '../../services/sales';
import { Sale, PaymentMethod, PaymentStatus } from '../../models/sale.interface';
import { SaleDetail } from '../../models/sale-detail.interface';
import { SalesListResponse } from '../../models/sales-list-response.interface';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesList implements OnInit {
  private readonly salesService = inject(SalesService);

  readonly isLoading = signal(true);
  readonly isLoadingToday = signal(true);
  readonly isLoadingDetail = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sales = signal<Sale[]>([]);
  readonly todaySales = signal<Sale[]>([]);
  readonly selectedSale = signal<SaleDetail | null>(null);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly paymentStatusFilter = signal<PaymentStatus | ''>('');
  readonly paymentMethodFilter = signal<PaymentMethod | ''>('');
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

  ngOnInit(): void {
    this.loadSales();
    this.loadSalesOfToday();
  }

  loadSales(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.salesService
      .getSales(targetPage, this.limit(), {
        payment_status: this.paymentStatusFilter() || undefined,
        payment_method: this.paymentMethodFilter() || undefined,
        date_from: this.dateFromFilter() || undefined,
        date_to: this.dateToFilter() || undefined,
      })
      .subscribe({
        next: (response: SalesListResponse) => {
          this.sales.set(response.data);
          this.page.set(response.meta.page);
          this.limit.set(response.meta.limit);
          this.total.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoading.set(false);

          const currentSelectedId = this.selectedSale()?.id;
          if (currentSelectedId) {
            const selected = response.data.find((sale) => sale.id === currentSelectedId);
            if (selected) {
              this.selectSale(selected.id);
              return;
            }
          }

          if (response.data.length > 0) {
            this.selectSale(response.data[0].id);
          } else {
            this.selectedSale.set(null);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar la lista de ventas.'
          );
        },
      });
  }

  loadSalesOfToday(): void {
    this.isLoadingToday.set(true);

    this.salesService.getSalesOfToday().subscribe({
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

  selectSale(saleId: string): void {
    this.isLoadingDetail.set(true);

    this.salesService.getSaleById(saleId).subscribe({
      next: (response) => {
        this.selectedSale.set(response.data);
        this.isLoadingDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDetail.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el detalle de la venta.'
        );
      },
    });
  }

  applyFilters(): void {
    this.loadSales(1);
  }

  clearFilters(): void {
    this.paymentStatusFilter.set('');
    this.paymentMethodFilter.set('');
    this.dateFromFilter.set('');
    this.dateToFilter.set('');
    this.loadSales(1);
  }

  onPaymentStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paymentStatusFilter.set(target.value as PaymentStatus | '');
  }

  onPaymentMethodFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paymentMethodFilter.set(target.value as PaymentMethod | '');
  }

  onDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateFromFilter.set(target.value);
  }

  onDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateToFilter.set(target.value);
  }

  refreshAll(): void {
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
}