import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getApiErrorMessage } from '../../core/utils/error-message.util';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  template: `
    <section class="page-shell commerce-page">
      <div class="container py-2 py-md-4">
        <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
          <div>
            <span class="brand-badge mb-3 d-inline-flex">Cart</span>
            <h1 class="display-6 fw-bold mb-2">Review your basket</h1>
            <p class="text-secondary mb-0">
              Update quantities, remove products, and place your order when you are ready.
            </p>
          </div>

          <a class="btn btn-outline-primary" routerLink="/products">Continue shopping</a>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger" role="alert">
            {{ errorMessage() }}
          </div>
        }

        <div class="row g-4">
          <div class="col-12 col-xl-8">
            <div class="commerce-panel p-3 p-md-4">
              @if ((cartItems$ | async)?.length) {
                <div class="d-grid gap-3">
                  @for (item of cartItems$ | async; track item.id) {
                    <div class="cart-item d-flex flex-column flex-md-row align-items-md-center gap-3">
                      <img class="cart-item-image" [src]="item.image" [alt]="item.name" />

                      <div class="flex-grow-1">
                        <h2 class="h5 fw-bold mb-1">{{ item.name }}</h2>
                        <p class="text-secondary mb-0">
                          {{ item.price | currency: 'USD' }} each
                        </p>
                      </div>

                      <div class="quantity-stepper">
                        <button
                          class="btn btn-outline-secondary"
                          type="button"
                          (click)="decreaseQuantity(item.id)"
                        >
                          -
                        </button>
                        <span class="fw-semibold">{{ item.qty }}</span>
                        <button
                          class="btn btn-outline-secondary"
                          type="button"
                          (click)="increaseQuantity(item.id, item.name)"
                        >
                          +
                        </button>
                      </div>

                      <div class="text-md-end">
                        <p class="h5 fw-bold mb-2">
                          {{ item.price * item.qty | currency: 'USD' }}
                        </p>
                        <button
                          class="btn btn-link link-danger text-decoration-none p-0"
                          type="button"
                          (click)="removeItem(item.id, item.name)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-5">
                  <h2 class="h4 fw-bold mb-2">Your cart is empty</h2>
                  <p class="text-secondary mb-4">
                    Start adding products to prepare your quick order.
                  </p>
                  <a class="btn btn-primary" routerLink="/products">Browse products</a>
                </div>
              }
            </div>
          </div>

          <div class="col-12 col-xl-4">
            <div class="commerce-panel cart-summary p-4">
              <h2 class="h4 fw-bold mb-4">Order summary</h2>

              <div class="d-flex justify-content-between mb-3">
                <span class="text-secondary">Items</span>
                <strong>{{ (cartCount$ | async) ?? 0 }}</strong>
              </div>

              <div class="d-flex justify-content-between mb-4">
                <span class="text-secondary">Total</span>
                <strong class="fs-4">{{ (totalPrice$ | async) ?? 0 | currency: 'USD' }}</strong>
              </div>

              <button
                class="btn btn-primary w-100"
                type="button"
                [disabled]="!(cartCount$ | async) || isPlacingOrder()"
                (click)="placeOrder()"
              >
                @if (isPlacingOrder()) {
                  <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  Placing order...
                } @else {
                  Place Order
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CartPageComponent {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly cartItems$ = this.cartService.getCart();
  protected readonly cartCount$ = this.cartService.cartCount$;
  protected readonly totalPrice$ = this.cartService.totalPrice$;
  protected readonly isPlacingOrder = signal(false);
  protected readonly errorMessage = signal('');

  protected increaseQuantity(productId: string, productName: string): void {
    const increased = this.cartService.increaseQuantity(productId);

    if (!increased) {
      this.toastService.warning(
        `You have reached the available stock for ${productName}.`,
        'Stock limit reached'
      );
    }
  }

  protected decreaseQuantity(productId: string): void {
    this.cartService.decreaseQuantity(productId);
  }

  protected removeItem(productId: string, productName: string): void {
    this.cartService.removeFromCart(productId);
    this.toastService.info(`${productName} removed from your cart.`, 'Cart updated');
  }

  protected placeOrder(): void {
    const cartItems = this.cartService.getCartSnapshot();

    if (!cartItems.length) {
      return;
    }

    this.errorMessage.set('');
    this.isPlacingOrder.set(true);

    this.orderService
      .createOrder({
        userId: this.authService.getCurrentUserId(),
        items: cartItems.map((item) => ({
          productId: item.id,
          qty: item.qty
        }))
      },
      cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        qty: item.qty
      })))
      .pipe(finalize(() => this.isPlacingOrder.set(false)))
      .subscribe({
        next: (order) => {
          this.cartService.clearCart();
          this.toastService.success('Order placed successfully. Tracking has started.', 'Order created');
          void this.router.navigate(['/tracking', order.id]);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(error, 'Unable to place your order right now. Please try again.')
          );
          this.toastService.error('We could not place the order. Please try again.', 'Order failed');
        }
      });
  }
}
