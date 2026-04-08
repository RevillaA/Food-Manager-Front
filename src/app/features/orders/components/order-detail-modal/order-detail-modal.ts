import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { OrderDetail } from '../../models/order-detail.interface';
import { OrderItem } from '../../models/order-item.interface';
import { Category } from '../../../categories/models/category.interface';
import { Product } from '../../../products/models/product.interface';

type OrderConfirmationAction = 'close' | 'cancel' | null;

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailModal {
  readonly isOpen = input<boolean>(false);
  readonly order = input<OrderDetail | null>(null);
  readonly categories = input<Category[]>([]);
  readonly products = input<Product[]>([]);
  readonly selectedCategoryId = input<string>('');
  readonly searchTerm = signal('');
  readonly isLoadingOrderDetail = input<boolean>(false);
  readonly isLoadingProducts = input<boolean>(false);
  readonly isBusy = input<boolean>(false);
  readonly canOperateOrder = input<boolean>(false);
  readonly canChargeOrder = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirmationAction = signal<OrderConfirmationAction>(null);

  readonly isConfirmationModalOpen = computed(() => this.confirmationAction() !== null);

  readonly filteredProducts = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    if (!normalizedSearch) {
      return this.products();
    }

    return this.products().filter((product) =>
      product.name.toLowerCase().includes(normalizedSearch)
    );
  });

  readonly confirmationConfig = computed(() => {
    const action = this.confirmationAction();

    if (action === 'close') {
      return {
        title: 'Confirmar cierre del pedido',
        description:
          'Estás a punto de cerrar este pedido. Al continuar, el pedido dejará de estar en edición y ya no podrás seguir agregando o modificando ítems desde esta ventana.',
        confirmText: 'Sí, cerrar pedido',
        confirmButtonClass:
          'bg-[#E2552E] text-white hover:bg-[#C94724] shadow-lg shadow-[#E2552E]/20',
        iconContainerClass: 'bg-amber-100 text-amber-700',
      };
    }

    if (action === 'cancel') {
      return {
        title: 'Confirmar cancelación del pedido',
        description:
          'Estás a punto de cancelar este pedido. Esta acción eliminará los detalles del pedido y ya no podrás continuar con su edición.',
        confirmText: 'Sí, cancelar pedido',
        confirmButtonClass:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
        iconContainerClass: 'bg-red-100 text-red-700',
      };
    }

    return {
      title: '',
      description: '',
      confirmText: '',
      confirmButtonClass: '',
      iconContainerClass: '',
    };
  });

  @Output() closed = new EventEmitter<void>();
  @Output() categoryFilterChanged = new EventEmitter<string>();
  @Output() clearCategoryFilter = new EventEmitter<void>();
  @Output() addProduct = new EventEmitter<Product>();
  @Output() increaseQuantity = new EventEmitter<OrderItem>();
  @Output() decreaseQuantity = new EventEmitter<OrderItem>();
  @Output() togglePreparation = new EventEmitter<OrderItem>();
  @Output() removeItem = new EventEmitter<OrderItem>();
  @Output() closeOrder = new EventEmitter<void>();
  @Output() cancelOrder = new EventEmitter<void>();
  @Output() chargeOrder = new EventEmitter<void>();

  close(): void {
    if (this.isBusy()) {
      return;
    }

    this.closeConfirmationModal();
    this.clearSearchTerm();
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (!this.isOpen()) {
      return;
    }

    if (this.isConfirmationModalOpen()) {
      this.closeConfirmationModal();
      return;
    }

    this.close();
  }

  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.categoryFilterChanged.emit(target.value);
  }

  onSearchTermChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearchTerm(): void {
    this.searchTerm.set('');
  }

  openCloseOrderConfirmation(): void {
    if (!this.canOperateOrder() || this.isBusy()) {
      return;
    }

    this.confirmationAction.set('close');
  }

  openCancelOrderConfirmation(): void {
    if (!this.canOperateOrder() || this.isBusy()) {
      return;
    }

    this.confirmationAction.set('cancel');
  }

  closeConfirmationModal(): void {
    if (this.isBusy()) {
      return;
    }

    this.confirmationAction.set(null);
  }

  confirmCurrentAction(): void {
    const action = this.confirmationAction();

    if (!action || this.isBusy()) {
      return;
    }

    if (action === 'close') {
      this.closeOrder.emit();
    }

    if (action === 'cancel') {
      this.cancelOrder.emit();
    }

    this.confirmationAction.set(null);
  }

  getCategoryTypeLabel(type: string): string {
    switch (type) {
      case 'MAIN_DISH':
        return 'Plato principal';
      case 'DRINK':
        return 'Bebida';
      case 'EXTRA':
        return 'Extra';
      case 'SWEET':
        return 'Dulce';
      default:
        return type;
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

  getOrderStatusBadgeClass(status: string): string {
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
}