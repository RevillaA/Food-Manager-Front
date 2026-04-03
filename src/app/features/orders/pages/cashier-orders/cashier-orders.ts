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
import { Sale } from '../../../sales/models/sale.interface';
import { QuickPaymentModal } from '../../../sales/components/quick-payment-modal/quick-payment-modal';

@Component({
  selector: 'app-cashier-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, QuickPaymentModal],
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

  readonly isLoadingSession = signal(true);
  readonly isLoadingOrders = signal(false);
  readonly isLoadingOrderDetail = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly isLoadingProducts = signal(false);
  readonly isLoadingSales = signal(false);

  readonly isCreatingOrder = signal(false);
  readonly isAddingProduct = signal(false);
  readonly isUpdatingItem = signal(false);
  readonly isClosingOrder = signal(false);
  readonly isCancellingOrder = signal(false);
  readonly isCreatingSale = signal(false);

  readonly errorMessage = signal<string | null>(null);
  readonly paymentErrorMessage = signal<string | null>(null);

  readonly activeSession = signal<DailySession | null>(null);
  readonly openOrders = signal<Order[]>([]);
  readonly closedOrdersPendingPayment = signal<Order[]>([]);
  readonly paidSales = signal<Sale[]>([]);
  readonly selectedOrder = signal<OrderDetail | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly selectedCategoryId = signal('');

  readonly isPaymentModalOpen = signal(false);

  readonly paidOrderIds = computed(() => {
    return new Set(this.paidSales().map((sale) => sale.order_id));
  });

  readonly hasActiveSession = computed(() => !!this.activeSession());
  readonly hasSelectedOrder = computed(() => !!this.selectedOrder());
  readonly selectedOrderItems = computed(() => this.selectedOrder()?.items ?? []);

  readonly isSelectedOrderPaid = computed(() => {
    const order = this.selectedOrder();
    if (!order) {
      return false;
    }

    return this.paidOrderIds().has(order.id);
  });

  readonly canOperateOrder = computed(() => {
    const order = this.selectedOrder();
    return !!order && order.status === 'OPEN';
  });

  readonly canChargeOrder = computed(() => {
    const order = this.selectedOrder();

    return (
      !!order &&
      order.status === 'CLOSED' &&
      !this.paidOrderIds().has(order.id)
    );
  });

  readonly isBusy = computed(() => {
    return (
      this.isCreatingOrder() ||
      this.isAddingProduct() ||
      this.isUpdatingItem() ||
      this.isClosingOrder() ||
      this.isCancellingOrder() ||
      this.isCreatingSale()
    );
  });

  readonly groupedProducts = computed(() => {
    const categoryId = this.selectedCategoryId();

    if (!categoryId) {
      return this.products();
    }

    return this.products().filter((product) => product.category.id === categoryId);
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadActiveSessionAndOrders();
  }

  loadActiveSessionAndOrders(selectedOrderId?: string): void {
    this.isLoadingSession.set(true);
    this.errorMessage.set(null);

    this.dailySessionsService.getActiveDailySession().subscribe({
      next: (response) => {
        this.activeSession.set(response.data);
        this.isLoadingSession.set(false);
        this.loadOrdersAndSales(selectedOrderId);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSession.set(false);

        if (error.status === 404) {
          this.activeSession.set(null);
          this.openOrders.set([]);
          this.closedOrdersPendingPayment.set([]);
          this.paidSales.set([]);
          this.selectedOrder.set(null);
          return;
        }

        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar la jornada activa.'
        );
      },
    });
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);

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

    this.productsService
      .getProducts(1, 100, {
        is_active: true,
        category_id: this.selectedCategoryId() || undefined,
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

  loadOrdersAndSales(selectedOrderId?: string): void {
    const session = this.activeSession();

    if (!session) {
      this.openOrders.set([]);
      this.closedOrdersPendingPayment.set([]);
      this.paidSales.set([]);
      this.selectedOrder.set(null);
      return;
    }

    this.isLoadingOrders.set(true);
    this.isLoadingSales.set(true);

    this.ordersService
      .getOrders(1, 100, {
        daily_session_id: session.id,
      })
      .subscribe({
        next: (ordersResponse: OrdersListResponse) => {
          this.salesService
            .getSales(1, 100, {
              daily_session_id: session.id,
            })
            .subscribe({
              next: (salesResponse) => {
                const sortedOrders = [...ordersResponse.data].sort((a, b) => {
                  if (a.order_number !== b.order_number) {
                    return a.order_number - b.order_number;
                  }

                  return (
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                });

                const paidOrderIds = new Set(
                  salesResponse.data.map((sale) => sale.order_id)
                );

                this.paidSales.set(salesResponse.data);
                this.openOrders.set(
                  sortedOrders.filter((order) => order.status === 'OPEN')
                );
                this.closedOrdersPendingPayment.set(
                  sortedOrders.filter(
                    (order) =>
                      order.status === 'CLOSED' && !paidOrderIds.has(order.id)
                  )
                );

                this.isLoadingOrders.set(false);
                this.isLoadingSales.set(false);

                const preferredOrderId = selectedOrderId || this.selectedOrder()?.id;

                if (preferredOrderId) {
                  const existsOpen = this.openOrders().some(
                    (order) => order.id === preferredOrderId
                  );
                  const existsClosedPending = this.closedOrdersPendingPayment().some(
                    (order) => order.id === preferredOrderId
                  );

                  if (existsOpen || existsClosedPending) {
                    this.selectOrder(preferredOrderId);
                    return;
                  }
                }

                if (this.openOrders().length > 0) {
                  this.selectOrder(this.openOrders()[0].id);
                  return;
                }

                if (this.closedOrdersPendingPayment().length > 0) {
                  this.selectOrder(this.closedOrdersPendingPayment()[0].id);
                  return;
                }

                this.selectedOrder.set(null);
              },
              error: (error: HttpErrorResponse) => {
                this.isLoadingOrders.set(false);
                this.isLoadingSales.set(false);
                this.errorMessage.set(
                  error.error?.message || 'No se pudieron cargar las ventas de la jornada.'
                );
              },
            });
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingOrders.set(false);
          this.isLoadingSales.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar los pedidos de la jornada.'
          );
        },
      });
  }

  selectOrder(orderId: string): void {
    this.isLoadingOrderDetail.set(true);

    this.ordersService.getOrderById(orderId).subscribe({
      next: (response) => {
        this.selectedOrder.set(response.data);
        this.isLoadingOrderDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingOrderDetail.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el detalle del pedido.'
        );
      },
    });
  }

  openTodaySession(): void {
    this.isCreatingOrder.set(true);

    this.dailySessionsService.openDailySession({}).subscribe({
      next: () => {
        this.isCreatingOrder.set(false);
        this.loadActiveSessionAndOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.isCreatingOrder.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo abrir la jornada del día.'
        );
      },
    });
  }

  createNewOrder(): void {
    this.isCreatingOrder.set(true);

    this.ordersService.createOrder({}).subscribe({
      next: (response) => {
        this.isCreatingOrder.set(false);
        this.loadActiveSessionAndOrders(response.data.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isCreatingOrder.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo crear el pedido.'
        );
      },
    });
  }

  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategoryId.set(target.value);
    this.loadProducts();
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId.set('');
    this.loadProducts();
  }

  addProductToOrder(product: Product): void {
    if (!this.hasActiveSession()) {
      this.errorMessage.set(
        'No existe una jornada activa. Primero debes abrir la jornada del día.'
      );
      return;
    }

    const currentOrder = this.selectedOrder();

    if (!currentOrder || currentOrder.status !== 'OPEN') {
      this.createOrderAndAddProduct(product);
      return;
    }

    this.addProductToExistingOrder(currentOrder.id, product);
  }

  private createOrderAndAddProduct(product: Product): void {
    this.isAddingProduct.set(true);

    this.ordersService.createOrder({}).subscribe({
      next: (response) => {
        const orderId = response.data.id;

        this.ordersService
          .addOrderItem(orderId, {
            product_id: product.id,
            quantity: 1,
          })
          .subscribe({
            next: () => {
              this.isAddingProduct.set(false);
              this.loadActiveSessionAndOrders(orderId);
            },
            error: (error: HttpErrorResponse) => {
              this.isAddingProduct.set(false);
              this.errorMessage.set(
                error.error?.message || 'No se pudo agregar el producto al nuevo pedido.'
              );
            },
          });
      },
      error: (error: HttpErrorResponse) => {
        this.isAddingProduct.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo crear el pedido.'
        );
      },
    });
  }

  private addProductToExistingOrder(orderId: string, product: Product): void {
    this.isAddingProduct.set(true);

    this.ordersService
      .addOrderItem(orderId, {
        product_id: product.id,
        quantity: 1,
      })
      .subscribe({
        next: () => {
          this.isAddingProduct.set(false);
          this.loadActiveSessionAndOrders(orderId);
        },
        error: (error: HttpErrorResponse) => {
          this.isAddingProduct.set(false);
          this.errorMessage.set(
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

    this.ordersService
      .updateOrderItem(order.id, item.id, {
        quantity: item.quantity + 1,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.loadActiveSessionAndOrders(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.errorMessage.set(
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

    this.ordersService
      .updateOrderItem(order.id, item.id, {
        quantity: item.quantity - 1,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.loadActiveSessionAndOrders(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.errorMessage.set(
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

    this.ordersService.removeOrderItem(order.id, item.id).subscribe({
      next: () => {
        this.isUpdatingItem.set(false);
        this.loadActiveSessionAndOrders(order.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdatingItem.set(false);
        this.errorMessage.set(
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

    this.ordersService
      .updateOrderItemPreparationStatus(order.id, item.id, {
        preparation_status: nextStatus,
      })
      .subscribe({
        next: () => {
          this.isUpdatingItem.set(false);
          this.loadActiveSessionAndOrders(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingItem.set(false);
          this.errorMessage.set(
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
      this.errorMessage.set('Un pedido sin items no puede cerrarse.');
      return;
    }

    const hasInProgressItems = order.items.some(
      (item) => item.preparation_status === 'IN_PROGRESS'
    );

    if (hasInProgressItems) {
      this.errorMessage.set(
        'Primero marca como SERVED todos los items antes de cerrar el pedido.'
      );
      return;
    }

    this.isClosingOrder.set(true);

    this.ordersService.closeOrder(order.id, {}).subscribe({
      next: () => {
        this.isClosingOrder.set(false);
        this.loadActiveSessionAndOrders(order.id);
      },
      error: (error: HttpErrorResponse) => {
        this.isClosingOrder.set(false);
        this.errorMessage.set(
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

    this.ordersService.cancelOrder(order.id, {}).subscribe({
      next: () => {
        this.isCancellingOrder.set(false);
        this.loadActiveSessionAndOrders();
      },
      error: (error: HttpErrorResponse) => {
        this.isCancellingOrder.set(false);
        this.errorMessage.set(
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

  confirmPayment(payload: CreateSaleRequest): void {
    this.isCreatingSale.set(true);
    this.paymentErrorMessage.set(null);

    this.salesService.createSale(payload).subscribe({
      next: () => {
        const paidOrderId = payload.order_id;

        this.isCreatingSale.set(false);
        this.isPaymentModalOpen.set(false);

        const remainingClosedOrders = this.closedOrdersPendingPayment().filter(
          (order) => order.id !== paidOrderId
        );
        this.closedOrdersPendingPayment.set(remainingClosedOrders);

        const nextSelectedOrderId =
          this.openOrders()[0]?.id ||
          remainingClosedOrders[0]?.id ||
          undefined;

        this.loadActiveSessionAndOrders(nextSelectedOrderId);
      },
      error: (error: HttpErrorResponse) => {
        this.isCreatingSale.set(false);
        this.paymentErrorMessage.set(
          error.error?.message || 'No se pudo registrar la venta.'
        );
      },
    });
  }

  getCategoryTypeLabel(type: string): string {
    switch (type) {
      case 'MAIN_DISH':
        return 'Plato principal';
      case 'DRINK':
        return 'Bebida';
      case 'EXTRA':
        return 'Extra';
      default:
        return type;
    }
  }

  getPreparationBadgeClass(preparationStatus: string): string {
    return preparationStatus === 'SERVED'
      ? 'badge badge--success'
      : 'badge badge--warning';
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