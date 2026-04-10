import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderDetail } from '../../../orders/models/order-detail.interface';
import { PaymentMethod, PaymentStatus } from '../../models/sale.interface';
import { CreateSaleRequest } from '../../models/create-sale-request.interface';

@Component({
  selector: 'app-quick-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-payment-modal.html',
  styleUrl: './quick-payment-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickPaymentModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly order = input<OrderDetail | null>(null);
  readonly errorMessage = input<string | null>(null);

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<CreateSaleRequest>();

  paymentStatus: PaymentStatus = 'PAID';
  paymentMethod: PaymentMethod = 'CASH';
  notes = '';
  private readonly defaultNote = 'No hay novedades';

  readonly canSubmit = computed(() => {
    const order = this.order();
    return !!order && order.status === 'CLOSED';
  });

  close(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (!this.isOpen()) {
      return;
    }

    this.close();
  }

  submit(): void {
    const order = this.order();

    if (!order || order.status !== 'CLOSED') {
      return;
    }

    this.confirmed.emit({
      order_id: order.id,
      payment_status: this.paymentStatus,
      payment_method: this.paymentMethod,
      notes: this.notes.trim() || this.defaultNote,
    });
  }

  reset(): void {
    this.paymentStatus = 'PAID';
    this.paymentMethod = 'CASH';
    this.notes = '';
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'PAID':
        return 'Pagado';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
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
