import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
  signal,
  input,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

import { SaleDetail } from '../../models/sale-detail.interface';

@Component({
  selector: 'app-sale-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './sale-detail-modal.html',
  styleUrl: './sale-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailModal {
  readonly isOpen = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly isUpdatingPaymentStatus = input<boolean>(false);
  readonly sale = input<SaleDetail | null>(null);
  readonly errorMessage = input<string | null>(null);
  readonly paymentUpdateErrorMessage = input<string | null>(null);
  readonly isConfirmingPayment = signal(false);

  @Output() closed = new EventEmitter<void>();
  @Output() markAsPaid = new EventEmitter<void>();

  close(): void {
    this.cancelPaymentConfirmation();
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (!this.isOpen()) {
      return;
    }

    if (this.isConfirmingPayment()) {
      this.cancelPaymentConfirmation();
      return;
    }

    this.close();
  }

  startPaymentConfirmation(): void {
    if (this.isUpdatingPaymentStatus() || this.sale()?.payment_status !== 'PENDING') {
      return;
    }

    this.isConfirmingPayment.set(true);
  }

  cancelPaymentConfirmation(): void {
    this.isConfirmingPayment.set(false);
  }

  requestMarkAsPaid(): void {
    if (this.isUpdatingPaymentStatus() || this.sale()?.payment_status !== 'PENDING') {
      return;
    }

    this.isConfirmingPayment.set(false);
    this.markAsPaid.emit();
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

  getPaymentActionLabel(): string {
    return this.isUpdatingPaymentStatus() ? 'Actualizando...' : 'Marcar como pagada';
  }

  getSaleDisplayIdentifier(sale: SaleDetail | null): string {
    const saleNumber = sale?.sale_number;

    if (saleNumber === undefined || saleNumber === null) {
      return 'Sin identificador';
    }

    const formattedDate = this.getCompactDate(sale?.created_at);
    const paddedSaleNumber = String(saleNumber).padStart(3, '0');

    return `VENTA-${paddedSaleNumber}-${formattedDate}`;
  }

  private getCompactDate(dateValue?: string): string {
    if (!dateValue) {
      return '00000000';
    }

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
