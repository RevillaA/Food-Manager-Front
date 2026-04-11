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

import { Order } from '../../models/order.interface';
import { OrderItem } from '../../models/order-item.interface';
import { OrderDetail } from '../../models/order-detail.interface';
import { OrdersListResponse } from '../../models/orders-list-response.interface';
import { OrdersService } from '../../services/orders';

import { Category } from '../../../categories/models/category.interface';
import { CategoriesService } from '../../../categories/services/categories';

import { Product } from '../../../products/models/product.interface';
import { ProductsListResponse } from '../../../products/models/products-list-response.interface';
import { ProductsService } from '../../../products/services/products';

import { SalesService } from '../../../sales/services/sales';
import { CreateSaleRequest } from '../../../sales/models/create-sale-request.interface';
import { QuickPaymentModal } from '../../../sales/components/quick-payment-modal/quick-payment-modal';
import { OrderDetailModal } from '../../components/order-detail-modal/order-detail-modal';

@Component({
  selector: 'app-cashier-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, QuickPaymentModal, OrderDetailModal],
  templateUrl: './cashier-orders.html',
  styleUrl: './cashier-orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashierOrders implements OnInit {
  private readonly dailySessionsService = inject(DailySessionsService);
  private readonly ordersService = inject(OrdersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly selectedOrderId = signal<string | null>(null);
  private latestOrderDetailRequestId = 0;

  readonly isLoadingSession = signal(true);
  readonly isLoadingOrders = signal(false);
  readonly isLoadingOrderDetail = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly isLoadingProducts = signal(false);

  readonly isOpeningSession = signal(false);
  readonly isCreatingOrder = signal(false);
  readonly isAddingProduct = signal(false);
  readonly isUpdatingItem = signal(false);
  readonly isClosingOrder = signal(false);
  readonly isCancellingOrder = signal(false);
  readonly isCreatingSale = signal(false);

  readonly errorMessage = signal<string | null>(null);
  readonly modalErrorMessage = signal<string | null>(null);
  readonly paymentErrorMessage = signal<string | null>(null);

  readonly activeSession = signal<DailySession | null>(null);
  readonly boardOrders = signal<Order[]>([]);
  readonly selectedOrder = signal<OrderDetail | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);

  readonly selectedCategoryId = signal('');
  readonly isPaymentModalOpen = signal(false);
  readonly isDetailModalOpen = signal(false);
  readonly isPaidOrdersCollapsed = signal(true);

  readonly canOperateOrder = computed(() => {
    const order = this.selectedOrder();
    return !!order && order.status === 'OPEN';
  });

  readonly canChargeOrder = computed(() => {
    const order = this.selectedOrder();

    const isChargedInBoard = !!order && this.paidOrders().some((item) => item.id === order.id);

    return !!order &&
      order.status === 'CLOSED' &&
      this.isOrderPendingCharge(order.payment_state) &&
      !isChargedInBoard;
  });

  readonly isBusy = computed(() => {
    return (
      this.isOpeningSession() ||
      this.isCreatingOrder() ||
      this.isAddingProduct() ||
      this.isUpdatingItem() ||
      this.isClosingOrder() ||
      this.isCancellingOrder() ||
      this.isCreatingSale()
    );
  });

  readonly filteredCatalogProducts = computed(() => {
    const categoryId = this.selectedCategoryId();

    if (!categoryId) {
      return this.products();
    }

    return this.products().filter((product) => product.category.id === categoryId);
  });

  readonly preparationOrders = computed(() => {
    return [...this.boardOrders()]
      .filter((order) => order.status === 'OPEN')
      .filter((order) => order.preparation_status !== 'SERVED')
      .sort((a, b) => this.compareOrders(a, b));
  });

  readonly servedOrders = computed(() => {
    return [...this.boardOrders()]
      .filter((order) => order.status === 'OPEN')
      .filter((order) => order.preparation_status === 'SERVED')
      .sort((a, b) => this.compareOrders(a, b));
  });

  readonly closedOrders = computed(() => {
    return [...this.boardOrders()]
      .filter((order) => order.status === 'CLOSED')
      .filter((order) => this.isOrderPendingCharge(order.payment_state))
      .sort((a, b) => this.compareOrders(a, b));
  });

  readonly paidOrders = computed(() => {
    return [...this.boardOrders()]
      .filter((order) => order.status === 'CLOSED')
      .filter((order) => this.isOrderCharged(order.payment_state))
      .sort((a, b) => this.compareOrders(a, b));
  });

  readonly totalVisibleOrders = computed(() => {
    return (
      this.preparationOrders().length +
      this.servedOrders().length +
      this.closedOrders().length +
      this.paidOrders().length
    );
  });

  readonly hasVisibleOrders = computed(() => {
    return this.totalVisibleOrders() > 0;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadActiveSessionAndOrders();
  }

  loadActiveSessionAndOrders(): void {
    this.isLoadingSession.set(true);
    this.errorMessage.set(null);

    this.dailySessionsService.getActiveDailySession().subscribe({
      next: (response) => {
        this.activeSession.set(response.data);
        this.isLoadingSession.set(false);
        this.loadBoardOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSession.set(false);

        if (error.status === 404) {
          this.activeSession.set(null);
          this.boardOrders.set([]);
          this.selectedOrderId.set(null);
          this.selectedOrder.set(null);
          this.isLoadingOrderDetail.set(false);
          this.isDetailModalOpen.set(false);
          return;
        }

        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar la jornada activa.'
        );
      },
    });
  }

  loadBoardOrders(): void {
    const session = this.activeSession();

    if (!session) {
      this.boardOrders.set([]);
      this.selectedOrderId.set(null);
      this.selectedOrder.set(null);
      this.isLoadingOrderDetail.set(false);
      return;
    }

    this.isLoadingOrders.set(true);
    this.errorMessage.set(null);

    this.ordersService
      .getOrdersBoard(1, 100, {
        daily_session_id: session.id,
      })
      .subscribe({
        next: (response: OrdersListResponse) => {
          const sessionOrders = response.data
            .filter((order) => order.daily_session_id === session.id)
            .filter((order) => order.status === 'OPEN' || order.status === 'CLOSED')
            .sort((a, b) => this.compareOrders(a, b));

          this.boardOrders.set(sessionOrders);
          this.isLoadingOrders.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingOrders.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los pedidos de la jornada activa.'
          );
        },
      });
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.errorMessage.set(null);

    this.categoriesService.getCategories(1, 100, { is_active: true }).subscribe({
      next: (response) => {
        this.categories.set(response.data);
        this.isLoadingCategories.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingCategories.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudieron cargar las categorías.'
        );
      },
    });
  }

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    this.errorMessage.set(null);

    this.productsService
      .getProducts(1, 100, {
        is_active: true,
      })
      .subscribe({
        next: (response: ProductsListResponse) => {
          const sorted = [...response.data].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
          );

          this.products.set(sorted);
          this.isLoadingProducts.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingProducts.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los productos.'
          );
        },
      });
  }

  openTodaySession(): void {
    this.isOpeningSession.set(true);
    this.errorMessage.set(null);

    this.dailySessionsService.openDailySession({}).subscribe({
      next: () => {
        this.isOpeningSession.set(false);
        this.loadActiveSessionAndOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.isOpeningSession.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo abrir la jornada del día.'
        );
      },
    });
  }

  createNewOrder(): void {
    this.isCreatingOrder.set(true);
    this.errorMessage.set(null);

    this.ordersService.createOrder({}).subscribe({
      next: (response) => {
        this.isCreatingOrder.set(false);
        this.loadBoardOrders();
        this.openOrderDetail(response.data.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isCreatingOrder.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo crear el pedido.'
        );
      },
    });
  }

  openOrderDetail(orderId: string): void {
    this.isDetailModalOpen.set(true);
    const shouldResetDetail = this.selectedOrderId() !== orderId;
    this.selectedOrderId.set(orderId);

    if (shouldResetDetail) {
      this.selectedOrder.set(null);
    }

    this.modalErrorMessage.set(null);
    this.loadSelectedOrder(orderId);
  }

  closeOrderDetail(): void {
    this.isDetailModalOpen.set(false);
    this.selectedOrderId.set(null);
    this.selectedOrder.set(null);
    this.isLoadingOrderDetail.set(false);
    this.selectedCategoryId.set('');
    this.modalErrorMessage.set(null);
  }

  loadSelectedOrder(orderId: string): void {
    const requestId = ++this.latestOrderDetailRequestId;
    this.isLoadingOrderDetail.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService.getOrderById(orderId).subscribe({
      next: (response) => {
        if (requestId !== this.latestOrderDetailRequestId || this.selectedOrderId() !== orderId) {
          return;
        }

        this.selectedOrder.set(response.data);
        this.isLoadingOrderDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.latestOrderDetailRequestId || this.selectedOrderId() !== orderId) {
          return;
        }

        this.isLoadingOrderDetail.set(false);
        this.modalErrorMessage.set(
          error.error?.message || 'No se pudo cargar el detalle del pedido.'
        );
      },
    });
  }

  setCatalogCategoryFilter(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  clearCatalogCategoryFilter(): void {
    this.selectedCategoryId.set('');
  }

  addProductToOrder(product: Product): void {
    const currentOrder = this.selectedOrder();

    if (!currentOrder || currentOrder.status !== 'OPEN') {
      this.modalErrorMessage.set('Solo puedes agregar productos a pedidos abiertos.');
      return;
    }

    this.isAddingProduct.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService
      .addOrderItem(currentOrder.id, {
        product_id: product.id,
        quantity: 1,
      })
      .subscribe({
        next: () => {
          this.isAddingProduct.set(false);
          this.refreshSelectedOrder(currentOrder.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isAddingProduct.set(false);
          this.modalErrorMessage.set(
            error.error?.message || 'No se pudo agregar el producto al pedido.'
          );
        },
      });
  }

  increaseItemQuantity(item: OrderItem): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    this.isUpdatingItem.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService
      .updateOrderItem(order.id, item.id, {
        quantity: item.quantity + 1,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.refreshSelectedOrder(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.modalErrorMessage.set(
            error.error?.message || 'No se pudo aumentar la cantidad.'
          );
        },
      });
  }

  decreaseItemQuantity(item: OrderItem): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }

    this.isUpdatingItem.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService
      .updateOrderItem(order.id, item.id, {
        quantity: item.quantity - 1,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.refreshSelectedOrder(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.modalErrorMessage.set(
            error.error?.message || 'No se pudo disminuir la cantidad.'
          );
        },
      });
  }

  removeItem(item: OrderItem): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    this.isUpdatingItem.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService.removeOrderItem(order.id, item.id).subscribe({
      next: () => {
        this.isUpdatingItem.set(false);
        this.refreshSelectedOrder(order.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdatingItem.set(false);
          this.modalErrorMessage.set(
          error.error?.message || 'No se pudo eliminar el item del pedido.'
        );
      },
    });
  }

  toggleItemPreparationStatus(item: OrderItem): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    const nextStatus =
      item.preparation_status === 'IN_PROGRESS' ? 'SERVED' : 'IN_PROGRESS';

    this.isUpdatingItem.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService
      .updateOrderItemPreparationStatus(order.id, item.id, {
        preparation_status: nextStatus,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.refreshSelectedOrder(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.modalErrorMessage.set(
            error.error?.message || 'No se pudo actualizar el estado del item.'
          );
        },
      });
  }

  closeSelectedOrder(): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    if (!order.items.length) {
      this.modalErrorMessage.set('Un pedido sin items no puede cerrarse.');
      return;
    }

    const hasInProgressItems = order.items.some(
      (item) => item.preparation_status === 'IN_PROGRESS'
    );

    if (hasInProgressItems) {
      this.modalErrorMessage.set(
        'Primero marca como servido todos los items antes de cerrar el pedido.'
      );
      return;
    }

    this.isClosingOrder.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService.closeOrder(order.id, {}).subscribe({
      next: () => {
        this.isClosingOrder.set(false);
        this.refreshSelectedOrder(order.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isClosingOrder.set(false);
          this.modalErrorMessage.set(
          error.error?.message || 'No se pudo cerrar el pedido.'
        );
      },
    });
  }

  cancelSelectedOrder(): void {
    const order = this.selectedOrder();
    if (!order) {
      return;
    }

    this.isCancellingOrder.set(true);
    this.modalErrorMessage.set(null);

    this.ordersService.cancelOrder(order.id, {}).subscribe({
      next: () => {
        this.isCancellingOrder.set(false);
        this.loadBoardOrders();
        this.closeOrderDetail();
      },
      error: (error: HttpErrorResponse) => {
        this.isCancellingOrder.set(false);
          this.modalErrorMessage.set(
          error.error?.message || 'No se pudo cancelar el pedido.'
        );
      },
    });
  }

  openPaymentModal(): void {
    this.paymentErrorMessage.set(null);

    if (!this.canChargeOrder()) {
      return;
    }

    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    if (this.isCreatingSale()) {
      return;
    }

    this.isPaymentModalOpen.set(false);
    this.paymentErrorMessage.set(null);
  }

  togglePaidOrdersVisibility(): void {
    this.isPaidOrdersCollapsed.update((value) => !value);
  }

  confirmPayment(payload: CreateSaleRequest): void {
    if (!this.selectedOrder()) {
      return;
    }

    this.isCreatingSale.set(true);
    this.paymentErrorMessage.set(null);

    this.salesService.createSale(payload).subscribe({
      next: () => {
        this.isCreatingSale.set(false);
        this.isPaymentModalOpen.set(false);
        this.closeOrderDetail();
        this.loadBoardOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.isCreatingSale.set(false);
        this.paymentErrorMessage.set(
          error.error?.message || 'No se pudo registrar la venta.'
        );
      },
    });
  }

  private refreshSelectedOrder(orderId: string): void {
    this.loadSelectedOrder(orderId);
    this.loadBoardOrders();
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

  getPaymentStateLabel(status?: string): string {
    switch (status) {
      case 'PAID':
        return 'Pagado';
      case 'PENDING':
        return 'Pendiente';
      case 'UNPAID':
        return 'Sin venta';
      default:
        return 'Sin venta';
    }
  }

  getPaymentStateBadgeClass(status?: string): string {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-700';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'UNPAID':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

  private getPreparationPriority(status: string): number {
    switch (status) {
      case 'IN_PROGRESS':
        return 0;
      case 'READY':
        return 1;
      case 'PENDING':
        return 2;
      case 'SERVED':
        return 3;
      default:
        return 4;
    }
  }

  private isOrderCharged(paymentState?: string): boolean {
    return paymentState === 'PAID' || paymentState === 'PENDING';
  }

  private isOrderPendingCharge(paymentState?: string): boolean {
    return !paymentState || paymentState === 'UNPAID';
  }

  private compareOrders(a: Order, b: Order): number {
    const preparationA = this.getPreparationPriority(a.preparation_status);
    const preparationB = this.getPreparationPriority(b.preparation_status);

    if (preparationA !== preparationB) {
      return preparationA - preparationB;
    }

    if (a.order_number !== b.order_number) {
      return a.order_number - b.order_number;
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
}
