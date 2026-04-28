import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  CreateOrderPayload,
  Order,
  OrderApiItem,
  OrderApiModel,
  OrderItem,
  ProductApiModel
} from '../models/commerce.models';
import { environment } from '../../environments/environment';

const DEFAULT_ORDER_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 viewBox%3D%220 0 200 140%22%3E%3Crect width%3D%22200%22 height%3D%22140%22 rx%3D%2218%22 fill%3D%22%23e2e8f0%22/%3E%3Cpath d%3D%22M52 68h96v12H52zM66 48h68v12H66zM44 88h112v12H44z%22 fill%3D%22%2394a3b8%22/%3E%3C/svg%3E';

type StoredOrderItemCache = Record<string, OrderItem[]>;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ordersUrl = environment.api.ordersUrl;
  private readonly orderItemCacheStorageKey = 'quick_commerce_order_items';
  private readonly lastTrackedOrderStorageKey = 'quick_commerce_last_order_id';
  private readonly orderItemCache = this.readStoredOrderItemCache();

  createOrder(payload: CreateOrderPayload, fallbackItems: OrderItem[] = []): Observable<Order> {
    return this.http.post<unknown>(this.ordersUrl, payload).pipe(
      map((response) => this.extractOrder(response)),
      map((response) => this.normalizeOrder(response, payload, payload.userId, undefined, fallbackItems)),
      map((order) => {
        this.storeOrderItems(order);
        return order;
      })
    );
  }

  getOrderById(orderId: string): Observable<Order> {
    this.rememberTrackedOrderId(orderId);
    const cachedItems = this.getStoredOrderItems(orderId);

    return this.http
      .get<unknown>(`${this.ordersUrl}/${orderId}`)
      .pipe(
        map((response) => this.extractOrder(response)),
        map((response) => this.normalizeOrder(response, undefined, 'mock-user', orderId, cachedItems)),
        map((order) => {
          this.storeOrderItems(order);
          return order;
        })
      );
  }

  getLastTrackedOrderId(): string | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const storedOrderId = localStorage.getItem(this.lastTrackedOrderStorageKey);

    return storedOrderId?.trim() ? storedOrderId.trim() : null;
  }

  rememberTrackedOrderId(orderId: string): void {
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId || !this.canUseStorage()) {
      return;
    }

    localStorage.setItem(this.lastTrackedOrderStorageKey, normalizedOrderId);
  }

  private extractOrder(response: unknown): OrderApiModel {
    if (!response || typeof response !== 'object') {
      throw new Error('Order API returned an unexpected response.');
    }

    const directOrder = response as OrderApiModel;

    if (this.hasOrderIdentity(directOrder)) {
      return directOrder;
    }

    const objectResponse = response as Record<string, unknown>;

    for (const key of ['order', 'data', 'result', 'payload']) {
      const value = objectResponse[key];

      if (!value || typeof value !== 'object') {
        continue;
      }

      const nestedOrder = value as OrderApiModel;

      if (this.hasOrderIdentity(nestedOrder)) {
        return nestedOrder;
      }

      if ('order' in (value as Record<string, unknown>)) {
        const deepNestedOrder = (value as Record<string, unknown>)['order'];

        if (deepNestedOrder && typeof deepNestedOrder === 'object') {
          const extractedOrder = deepNestedOrder as OrderApiModel;

          if (this.hasOrderIdentity(extractedOrder)) {
            return extractedOrder;
          }
        }
      }
    }

    return directOrder;
  }

  private hasOrderIdentity(order: OrderApiModel): boolean {
    return !!(order.id || order._id || order.orderId);
  }

  private normalizeOrder(
    response: OrderApiModel,
    fallbackPayload?: CreateOrderPayload,
    fallbackUserId = 'mock-user',
    fallbackOrderId?: string,
    fallbackItems: OrderItem[] = []
  ): Order {
    const resolvedId = response.id || response._id || response.orderId || fallbackOrderId;

    if (!resolvedId) {
      throw new Error('Order id missing from API response.');
    }

    const items = this.normalizeItems(response.items, fallbackPayload, fallbackItems);
    const totalAmount =
      Number(response.totalAmount ?? response.totalPrice ?? 0) ||
      items.reduce((total, item) => total + item.price * item.qty, 0);

    return {
      id: resolvedId,
      userId: response.userId || fallbackPayload?.userId || fallbackUserId,
      status: response.status || 'PENDING',
      items,
      totalAmount,
      createdAt: response.createdAt
    };
  }

  private normalizeItems(
    items: OrderApiItem[] | undefined,
    fallbackPayload?: CreateOrderPayload,
    fallbackItems: OrderItem[] = []
  ): OrderItem[] {
    const fallbackItemMap = this.toFallbackItemMap(fallbackItems);

    if (Array.isArray(items) && items.length > 0) {
      return items.map((item, index) => this.normalizeItem(item, index, fallbackItemMap));
    }

    if (fallbackPayload?.items.length) {
      return fallbackPayload.items.map((item, index) => {
        const fallbackItem = fallbackItemMap.get(item.productId);

        return {
          productId: item.productId,
          name: fallbackItem?.name || `Product ${index + 1}`,
          price: Number(fallbackItem?.price ?? 0),
          image: fallbackItem?.image || DEFAULT_ORDER_IMAGE,
          qty: Math.max(1, Number(item.qty ?? fallbackItem?.qty ?? 1))
        };
      });
    }

    return fallbackItems.map((item, index) => this.normalizeStoredOrderItem(item, index));
  }

  private normalizeItem(
    item: OrderApiItem,
    index: number,
    fallbackItemMap: Map<string, OrderItem>
  ): OrderItem {
    const nestedProduct = this.asProductModel(item.productId) || this.asNestedProduct(item);
    const resolvedProductId =
      (typeof item.productId === 'string' ? item.productId : undefined) ||
      nestedProduct?.id ||
      nestedProduct?._id ||
      `product-${index + 1}`;
    const fallbackItem = fallbackItemMap.get(resolvedProductId);

    return {
      productId: resolvedProductId,
      name:
        this.firstNonEmptyText(
          item.name,
          nestedProduct?.name,
          nestedProduct?.productName,
          nestedProduct?.title,
          fallbackItem?.name
        ) || `Product ${index + 1}`,
      price: this.firstFiniteNumber(
        item.price,
        nestedProduct?.price,
        nestedProduct?.salePrice,
        nestedProduct?.mrp,
        fallbackItem?.price,
        0
      ),
      image:
        this.firstNonEmptyText(
          item.image,
          nestedProduct?.image,
          nestedProduct?.imageUrl,
          nestedProduct?.thumbnail,
          fallbackItem?.image
        ) || DEFAULT_ORDER_IMAGE,
      qty: Math.max(1, Number(item.qty ?? item.quantity ?? fallbackItem?.qty ?? 1))
    };
  }

  private normalizeStoredOrderItem(item: OrderItem, index: number): OrderItem {
    return {
      productId: item.productId,
      name: item.name || `Product ${index + 1}`,
      price: Number(item.price ?? 0),
      image: item.image || DEFAULT_ORDER_IMAGE,
      qty: Math.max(1, Number(item.qty ?? 1))
    };
  }

  private toFallbackItemMap(items: OrderItem[]): Map<string, OrderItem> {
    return new Map(items.map((item) => [item.productId, this.normalizeStoredOrderItem(item, 0)]));
  }

  private firstNonEmptyText(...values: Array<string | undefined>): string | undefined {
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
  }

  private firstFiniteNumber(...values: Array<number | undefined>): number {
    const resolvedValue = values.find((value) => Number.isFinite(Number(value)));

    return Number(resolvedValue ?? 0);
  }

  private storeOrderItems(order: Order): void {
    this.rememberTrackedOrderId(order.id);
    this.orderItemCache[order.id] = order.items.map((item, index) =>
      this.normalizeStoredOrderItem(item, index)
    );

    this.persistOrderItemCache();
  }

  private getStoredOrderItems(orderId: string): OrderItem[] {
    return this.orderItemCache[orderId] ?? [];
  }

  private readStoredOrderItemCache(): StoredOrderItemCache {
    if (!this.canUseStorage()) {
      return {};
    }

    try {
      const storedCache = localStorage.getItem(this.orderItemCacheStorageKey);

      if (!storedCache) {
        return {};
      }

      const parsedCache = JSON.parse(storedCache) as StoredOrderItemCache;

      if (!parsedCache || typeof parsedCache !== 'object') {
        return {};
      }

      return Object.fromEntries(
        Object.entries(parsedCache).map(([orderId, items]) => [
          orderId,
          Array.isArray(items)
            ? items
                .filter((item) => item && typeof item.productId === 'string')
                .map((item, index) => this.normalizeStoredOrderItem(item, index))
            : []
        ])
      );
    } catch {
      return {};
    }
  }

  private persistOrderItemCache(): void {
    if (!this.canUseStorage()) {
      return;
    }

    localStorage.setItem(this.orderItemCacheStorageKey, JSON.stringify(this.orderItemCache));
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private asNestedProduct(item: OrderApiItem): ProductApiModel | null {
    const candidate = (item as Record<string, unknown>)['product'];

    if (candidate && typeof candidate === 'object') {
      return candidate as ProductApiModel;
    }

    return null;
  }

  private asProductModel(value: string | ProductApiModel | undefined): ProductApiModel | null {
    if (value && typeof value === 'object') {
      return value;
    }

    return null;
  }
}
