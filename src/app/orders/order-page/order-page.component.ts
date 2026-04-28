import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Order } from '../../models/commerce.models';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="page-shell commerce-page">
      <div class="container py-2 py-md-4">
        <div class="commerce-panel p-4 p-md-5">
          <div class="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 mb-4">
            <div>
              <span class="brand-badge mb-3 d-inline-flex">Live Order Tracking</span>
              <h1 class="display-6 fw-bold mb-2">Order {{ order?.id || 'Tracking' }}</h1>
              <p class="text-secondary mb-0">
                Watch your order status update automatically every few seconds.
              </p>
            </div>

            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-outline-primary" routerLink="/tracking">Tracking home</a>
              <a class="btn btn-outline-primary" routerLink="/products">Browse products</a>
              <a class="btn btn-primary" routerLink="/cart">View cart</a>
            </div>
          </div>

          @if (errorMessage) {
            <div class="alert alert-danger mb-4" role="alert">
              {{ errorMessage }}
            </div>
          }

          @if (isLoading) {
            <div class="d-flex flex-column align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
              <p class="text-secondary mb-0">Loading order details...</p>
            </div>
          } @else if (order) {
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <p class="text-secondary text-uppercase small fw-semibold mb-1">Current status</p>
                <span [class]="statusBadgeClass(order.status)">
                  {{ order.status }}
                </span>
              </div>

              <div class="text-md-end">
                @if (order.createdAt) {
                  <p class="text-secondary mb-1">Created {{ order.createdAt | date: 'medium' }}</p>
                }

                @if (isRefreshing) {
                  <p class="text-primary small fw-semibold mb-0">Refreshing status...</p>
                }
              </div>
            </div>

            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Price</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order.items; track item.productId) {
                    <tr>
                      <td>
                        <div class="d-flex align-items-center gap-3">
                          <img class="order-item-image" [src]="item.image" [alt]="item.name" />
                          <div>
                            <div class="fw-semibold">{{ item.name }}</div>
                            <div class="text-secondary small">Product ID: {{ item.productId }}</div>
                          </div>
                        </div>
                      </td>
                      <td>{{ item.qty }}</td>
                      <td>{{ item.price * item.qty | currency: 'USD' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="d-flex justify-content-between align-items-center border-top pt-4 mt-4">
              <span class="text-secondary">Total amount</span>
              <strong class="fs-4">{{ order.totalAmount | currency: 'USD' }}</strong>
            </div>
          } @else {
            <div class="text-center py-5">
              <h2 class="h4 fw-bold mb-2">Order not found</h2>
              <p class="text-secondary mb-4">We could not load this order yet. Please try again.</p>
              <a class="btn btn-primary" routerLink="/tracking">Back to tracking</a>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class OrderPageComponent {
  @Input() order: Order | null = null;
  @Input() isLoading = false;
  @Input() isRefreshing = false;
  @Input() errorMessage = '';

  protected statusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'badge status-badge status-confirmed';
      case 'CANCELLED':
        return 'badge status-badge status-cancelled';
      default:
        return 'badge status-badge status-pending';
    }
  }
}
