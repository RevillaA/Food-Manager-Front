import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { DailySession, DailySessionStatus } from '../../models/daily-session.interface';
import { DailySessionsListResponse } from '../../models/daily-sessions-list-response.interface';
import { DailySessionsService } from '../../services/daily-sessions';

import { OrdersService } from '../../../orders/services/orders';
import { Order } from '../../../orders/models/order.interface';
import { OrdersListResponse } from '../../../orders/models/orders-list-response.interface';

@Component({
  selector: 'app-daily-session-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './daily-session-list.html',
  styleUrl: './daily-session-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySessionList implements OnInit {
  private readonly dailySessionsService = inject(DailySessionsService);
  private readonly ordersService = inject(OrdersService);

  readonly isLoading = signal(true);
  readonly isActiveLoading = signal(true);
  readonly isSessionActionLoading = signal<string | null>(null);
  readonly isOrdersLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly activeSession = signal<DailySession | null>(null);
  readonly sessions = signal<DailySession[]>([]);
  readonly selectedSession = signal<DailySession | null>(null);
  readonly selectedSessionOrders = signal<Order[]>([]);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly statusFilter = signal<DailySessionStatus | ''>('');
  readonly dateFilter = signal('');

  ngOnInit(): void {
    this.loadActiveSession();
    this.loadSessions();
  }

  loadActiveSession(): void {
    this.isActiveLoading.set(true);

    this.dailySessionsService.getActiveDailySession().subscribe({
      next: (response) => {
        this.activeSession.set(response.data);
        this.isActiveLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.activeSession.set(null);
        } else {
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar la jornada activa.'
          );
        }

        this.isActiveLoading.set(false);
      },
    });
  }

  loadSessions(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dailySessionsService
      .getDailySessions(targetPage, this.limit(), {
        status: this.statusFilter() || undefined,
        session_date: this.dateFilter() || undefined,
      })
      .subscribe({
        next: (response: DailySessionsListResponse) => {
          this.sessions.set(response.data);
          this.page.set(response.meta.page);
          this.limit.set(response.meta.limit);
          this.total.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoading.set(false);

          const currentSelectedId = this.selectedSession()?.id;
          if (currentSelectedId) {
            const selected = response.data.find((session) => session.id === currentSelectedId);
            if (selected) {
              this.selectedSession.set(selected);
              this.loadOrdersForSession(selected.id);
              return;
            }
          }

          if (response.data.length > 0) {
            this.selectSession(response.data[0]);
          } else {
            this.selectedSession.set(null);
            this.selectedSessionOrders.set([]);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar la lista de jornadas.'
          );
          this.isLoading.set(false);
        },
      });
  }

  selectSession(session: DailySession): void {
    this.selectedSession.set(session);
    this.loadOrdersForSession(session.id);
  }

  loadOrdersForSession(dailySessionId: string): void {
    this.isOrdersLoading.set(true);

    this.ordersService
      .getOrders(1, 100, { daily_session_id: dailySessionId })
      .subscribe({
        next: (response: OrdersListResponse) => {
          const sorted = [...response.data].sort((a, b) => {
            if (a.order_number !== b.order_number) {
              return a.order_number - b.order_number;
            }

            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          this.selectedSessionOrders.set(sorted);
          this.isOrdersLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los pedidos de la jornada.'
          );
          this.isOrdersLoading.set(false);
        },
      });
  }

  openTodaySession(): void {
    this.isSessionActionLoading.set('open');

    this.dailySessionsService.openDailySession({}).subscribe({
      next: () => {
        this.isSessionActionLoading.set(null);
        this.loadActiveSession();
        this.loadSessions(1);
      },
      error: (error: HttpErrorResponse) => {
        this.isSessionActionLoading.set(null);
        this.errorMessage.set(
          error.error?.message || 'No se pudo abrir la jornada del día.'
        );
      },
    });
  }

  closeSession(session: DailySession): void {
    this.isSessionActionLoading.set(session.id);

    this.dailySessionsService.closeDailySession(session.id, {}).subscribe({
      next: () => {
        this.isSessionActionLoading.set(null);
        this.loadActiveSession();
        this.loadSessions(this.page());
      },
      error: (error: HttpErrorResponse) => {
        this.isSessionActionLoading.set(null);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cerrar la jornada.'
        );
      },
    });
  }

  reopenSession(session: DailySession): void {
    this.isSessionActionLoading.set(session.id);

    this.dailySessionsService
      .updateDailySessionStatus(session.id, { status: 'OPEN' })
      .subscribe({
        next: () => {
          this.isSessionActionLoading.set(null);
          this.loadActiveSession();
          this.loadSessions(this.page());
        },
        error: (error: HttpErrorResponse) => {
          this.isSessionActionLoading.set(null);
          this.errorMessage.set(
            error.error?.message || 'No se pudo reabrir la jornada.'
          );
        },
      });
  }

  applyFilters(): void {
    this.loadSessions(1);
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.dateFilter.set('');
    this.loadSessions(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value as DailySessionStatus | '';
    this.statusFilter.set(value);
  }

  onDateFilterChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateFilter.set(target.value);
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadSessions(this.page() - 1);
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadSessions(this.page() + 1);
  }

  getPreparationBadgeClass(preparationStatus: string): string {
    return preparationStatus === 'SERVED' ? 'badge badge--success' : 'badge badge--warning';
  }

  getOrderStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'badge badge--warning';
      case 'CLOSED':
        return 'badge badge--success';
      case 'CANCELLED':
        return 'badge badge--danger';
      default:
        return 'badge';
    }
  }
}