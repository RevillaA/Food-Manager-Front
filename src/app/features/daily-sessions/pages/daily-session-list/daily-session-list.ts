import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { DailySession, DailySessionStatus } from '../../models/daily-session.interface';
import { DailySessionsListResponse } from '../../models/daily-sessions-list-response.interface';
import { DailySessionsService } from '../../services/daily-sessions';

import { OrdersService } from '../../../orders/services/orders';
import { Order } from '../../../orders/models/order.interface';
import { OrdersListResponse } from '../../../orders/models/orders-list-response.interface';
import { DailySessionDetailModal } from '../../components/daily-session-detail-modal/daily-session-detail-modal';

@Component({
  selector: 'app-daily-session-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DailySessionDetailModal],
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
  readonly errorMessage = signal<string | null>(null);

  readonly activeSession = signal<DailySession | null>(null);
  readonly sessions = signal<DailySession[]>([]);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly statusFilter = signal<DailySessionStatus | ''>('');
  readonly dateFilter = signal('');

  readonly isDetailModalOpen = signal(false);
  readonly isDetailLoading = signal(false);
  readonly detailSession = signal<DailySession | null>(null);
  readonly detailOrders = signal<Order[]>([]);

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
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar la lista de jornadas.'
          );
          this.isLoading.set(false);
        },
      });
  }

  openSessionDetail(session: DailySession): void {
    this.isDetailModalOpen.set(true);
    this.isDetailLoading.set(true);
    this.detailSession.set(session);
    this.detailOrders.set([]);
    this.errorMessage.set(null);

    this.dailySessionsService.getDailySessionById(session.id).subscribe({
      next: (response) => {
        this.detailSession.set(response.data);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el detalle de la jornada.'
        );
      },
    });

    this.ordersService
      .getOrdersBoard(1, 100, { daily_session_id: session.id })
      .subscribe({
        next: (response: OrdersListResponse) => {
          const sorted = [...response.data].sort((a, b) => {
            if (a.order_number !== b.order_number) {
              return a.order_number - b.order_number;
            }

            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          this.detailOrders.set(sorted);
          this.isDetailLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los pedidos de la jornada.'
          );
          this.isDetailLoading.set(false);
        },
      });
  }

  closeSessionDetail(): void {
    this.isDetailModalOpen.set(false);
    this.detailSession.set(null);
    this.detailOrders.set([]);
    this.isDetailLoading.set(false);
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

        if (this.detailSession()?.id === session.id) {
          this.openSessionDetail(session);
        }
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

          if (this.detailSession()?.id === session.id) {
            this.openSessionDetail(session);
          }
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
    this.statusFilter.set(target.value as DailySessionStatus | '');
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

  getSessionStatusLabel(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Abierta';
      case 'CLOSED':
        return 'Cerrada';
      default:
        return status;
    }
  }
}
