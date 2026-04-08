import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

import { DailySession } from '../../models/daily-session.interface';
import { Order } from '../../../orders/models/order.interface';

@Component({
  selector: 'app-daily-session-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './daily-session-detail-modal.html',
  styleUrl: './daily-session-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySessionDetailModal {
  readonly isOpen = input<boolean>(false);
  readonly session = input<DailySession | null>(null);
  readonly orders = input<Order[]>([]);
  readonly isLoadingOrders = input<boolean>(false);

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
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

  getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Abierto';
      case 'CLOSED':
        return 'Cerrado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getPreparationStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En preparación';
      case 'READY':
        return 'Listo';
      case 'SERVED':
        return 'Servido';
      default:
        return status;
    }
  }

  getPreparationBadgeClass(preparationStatus: string): string {
    switch (preparationStatus) {
      case 'SERVED':
        return 'bg-emerald-100 text-emerald-700';
      case 'READY':
        return 'bg-sky-100 text-sky-700';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700';
      case 'PENDING':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getOrderBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-100 text-amber-700';
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  printDetail(): void {
    const session = this.session();
    const orders = this.orders();

    if (!session) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');

    if (!printWindow) {
      return;
    }

    const ordersRows = orders
      .map(
        (order) => `
          <tr>
            <td>#${order.order_number}</td>
            <td>${this.escapeHtml(this.getOrderStatusLabel(order.status))}</td>
            <td>${this.escapeHtml(this.getPreparationStatusLabel(order.preparation_status))}</td>
            <td>$ ${Number(order.subtotal).toFixed(2)}</td>
            <td>${this.escapeHtml(order.created_by_user.full_name)}</td>
            <td>${this.formatDate(order.created_at)}</td>
          </tr>
        `
      )
      .join('');

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Detalle de jornada</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111111;
              margin: 32px;
            }
            h1, h2, h3 {
              margin: 0 0 12px;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin: 20px 0 28px;
            }
            .box {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px 14px;
              background: #fafafa;
            }
            .label {
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 6px;
            }
            .value {
              font-size: 14px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #fff8ef;
            }
          </style>
        </head>
        <body>
          <h1>Detalle de jornada</h1>
          <p>Reporte generado desde Revis Food Control.</p>

          <div class="meta">
            <div class="box">
              <div class="label">Fecha</div>
              <div class="value">${this.formatDate(session.session_date, true)}</div>
            </div>
            <div class="box">
              <div class="label">Estado</div>
              <div class="value">${this.escapeHtml(this.getSessionStatusLabel(session.status))}</div>
            </div>
            <div class="box">
              <div class="label">Apertura</div>
              <div class="value">${this.formatDate(session.opened_at)}</div>
            </div>
            <div class="box">
              <div class="label">Cierre</div>
              <div class="value">${session.closed_at ? this.formatDate(session.closed_at) : '—'}</div>
            </div>
            <div class="box">
              <div class="label">Abierta por</div>
              <div class="value">${this.escapeHtml(session.opened_by_user?.full_name || '—')}</div>
            </div>
            <div class="box">
              <div class="label">Cerrada por</div>
              <div class="value">${this.escapeHtml(session.closed_by_user?.full_name || '—')}</div>
            </div>
          </div>

          <h2>Pedidos asociados</h2>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Estado</th>
                <th>Preparación</th>
                <th>Subtotal</th>
                <th>Creado por</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              ${ordersRows || '<tr><td colspan="6">No hay pedidos registrados en esta jornada.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private formatDate(value: string, dateOnly = false): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(dateOnly
        ? {}
        : {
            hour: '2-digit',
            minute: '2-digit',
          }),
    }).format(date);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}