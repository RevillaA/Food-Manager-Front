import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Order, OrderPreparationStatus, OrderStatus } from '../models/order.interface';
import { OrderItem } from '../models/order-item.interface';
import { OrderDetail } from '../models/order-detail.interface';
import { OrdersListResponse } from '../models/orders-list-response.interface';
import { CreateOrderRequest } from '../models/create-order-request.interface';
import { AddOrderItemRequest } from '../models/add-order-item-request.interface';
import { UpdateOrderItemRequest } from '../models/update-order-item-request.interface';
import { UpdateOrderItemPreparationStatusRequest } from '../models/update-order-item-preparation-status-request.interface';
import { CancelOrderRequest } from '../models/cancel-order-request.interface';
import { CloseOrderRequest } from '../models/close-order-request.interface';

interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

interface OrderDetailResponse {
  success: boolean;
  message: string;
  data: OrderDetail;
}

interface OrderItemMutationResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    item: OrderItem;
  };
}

interface OpenOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  createOrder(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, payload);
  }

  getOrders(
    page = 1,
    limit = 10,
    filters?: {
      status?: OrderStatus;
      preparation_status?: OrderPreparationStatus;
      daily_session_id?: string;
    }
  ): Observable<OrdersListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.preparation_status) {
      params = params.set('preparation_status', filters.preparation_status);
    }

    if (filters?.daily_session_id) {
      params = params.set('daily_session_id', filters.daily_session_id);
    }

    return this.http.get<OrdersListResponse>(this.baseUrl, { params });
  }

  getOpenOrders(): Observable<OpenOrdersResponse> {
    return this.http.get<OpenOrdersResponse>(`${this.baseUrl}/open`);
  }

  getOrderById(id: string): Observable<OrderDetailResponse> {
    return this.http.get<OrderDetailResponse>(`${this.baseUrl}/${id}`);
  }

  addOrderItem(orderId: string, payload: AddOrderItemRequest): Observable<OrderItemMutationResponse> {
    return this.http.post<OrderItemMutationResponse>(`${this.baseUrl}/${orderId}/items`, payload);
  }

  updateOrderItem(
    orderId: string,
    itemId: string,
    payload: UpdateOrderItemRequest
  ): Observable<OrderItemMutationResponse> {
    return this.http.patch<OrderItemMutationResponse>(
      `${this.baseUrl}/${orderId}/items/${itemId}`,
      payload
    );
  }

  updateOrderItemPreparationStatus(
    orderId: string,
    itemId: string,
    payload: UpdateOrderItemPreparationStatusRequest
  ): Observable<OrderItemMutationResponse> {
    return this.http.patch<OrderItemMutationResponse>(
      `${this.baseUrl}/${orderId}/items/${itemId}/preparation-status`,
      payload
    );
  }

  removeOrderItem(orderId: string, itemId: string): Observable<OrderResponse> {
    return this.http.delete<OrderResponse>(`${this.baseUrl}/${orderId}/items/${itemId}`);
  }

  cancelOrder(orderId: string, payload: CancelOrderRequest): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, payload);
  }

  closeOrder(orderId: string, payload: CloseOrderRequest): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/close`, payload);
  }
}