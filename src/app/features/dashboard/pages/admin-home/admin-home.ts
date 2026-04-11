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

import { DailySession } from '../../../daily-sessions/models/daily-session.interface';
import { DailySessionsService } from '../../../daily-sessions/services/daily-sessions';

import { Order } from '../../../orders/models/order.interface';
import { OrdersListResponse } from '../../../orders/models/orders-list-response.interface';
import { OrdersService } from '../../../orders/services/orders';

import { Sale } from '../../../sales/models/sale.interface';
import { SalesService } from '../../../sales/services/sales';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHome implements OnInit {
  private readonly dailySessionsService = inject(DailySessionsService);
  private readonly ordersService = inject(OrdersService);
  private readonly salesService = inject(SalesService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly activeSession = signal<DailySession | null>(null);
  readonly openOrders = signal<Order[]>([]);
  readonly closedOrdersPendingPayment = signal<Order[]>([]);
  readonly salesOfToday = signal<Sale[]>([]);

  readonly totalSoldToday = computed(() => {
    return this.salesOfToday().reduce((sum, sale) => sum + sale.total, 0);
  });

  readonly paidSalesCount = computed(() => {
    return this.salesOfToday().filter((sale) => sale.payment_status === 'PAID').length;
  });

  readonly pendingSalesCount = computed(() => {
    return this.salesOfToday().filter((sale) => sale.payment_status === 'PENDING').length;
  });

  readonly averageTicketToday = computed(() => {
    const sales = this.salesOfToday();
    if (!sales.length) {
      return 0;
    }

    return this.totalSoldToday() / sales.length;
  });

  readonly openOrdersCount = computed(() => this.openOrders().length);
  readonly pendingPaymentOrdersCount = computed(() => this.closedOrdersPendingPayment().length);

  readonly recentSales = computed(() => {
    return [...this.salesOfToday()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  });

  readonly recentOpenOrders = computed(() => {
    return [...this.openOrders()]
      .sort((a, b) => {
        if (a.order_number !== b.order_number) {
          return a.order_number - b.order_number;
        }

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dailySessionsService.getActiveDailySession().subscribe({
      next: (sessionResponse) => {
        this.activeSession.set(sessionResponse.data);
        this.loadSessionRelatedData(sessionResponse.data.id);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.activeSession.set(null);
          this.openOrders.set([]);
          this.closedOrdersPendingPayment.set([]);
          this.salesOfToday.set([]);
          this.isLoading.set(false);
          return;
        }

        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el inicio del administrador.'
        );
      },
    });
  }

  private loadSessionRelatedData(sessionId: string): void {
    this.ordersService
      .getOrders(1, 100, { daily_session_id: sessionId })
      .subscribe({
        next: (ordersResponse: OrdersListResponse) => {
          this.salesService
            .getSalesOfToday()
            .subscribe({
              next: (salesResponse) => {
                const paidOrderIds = new Set(
                  salesResponse.data.map((sale) => sale.order_id)
                );

                const sortedOrders = [...ordersResponse.data].sort((a, b) => {
                  if (a.order_number !== b.order_number) {
                    return a.order_number - b.order_number;
                  }

                  return (
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                });

                this.openOrders.set(
                  sortedOrders.filter((order) => order.status === 'OPEN')
                );

                this.closedOrdersPendingPayment.set(
                  sortedOrders.filter(
                    (order) =>
                      order.status === 'CLOSED' && !paidOrderIds.has(order.id)
                  )
                );

                this.salesOfToday.set(salesResponse.data);
                this.isLoading.set(false);
              },
              error: (error: HttpErrorResponse) => {
                this.isLoading.set(false);
                this.errorMessage.set(
                  error.error?.message || 'No se pudieron cargar las ventas del dÃ­a.'
                );
              },
            });
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los pedidos de la jornada.'
          );
        },
      });
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

  getPreparationBadgeClass(preparationStatus: string): string {
    return preparationStatus === 'SERVED'
      ? 'badge badge--success'
      : 'badge badge--warning';
  }
}
