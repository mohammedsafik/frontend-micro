import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../models/commerce.models';
import { ToastService } from '../../core/services/toast.service';
import { getApiErrorMessage } from '../../core/utils/error-message.util';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <section class="page-shell commerce-page">
      <div class="container py-2 py-md-4">
        <div class="commerce-hero mb-4 mb-md-5">
          <div>
            <span class="brand-badge mb-3 d-inline-flex">Quick Commerce</span>
            <h1 class="display-6 fw-bold mb-2">Fresh groceries, delivered fast</h1>
            <p class="text-secondary mb-0">
              Browse live inventory, add items to your cart, and place orders in a few taps.
            </p>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger mb-4" role="alert">
            {{ errorMessage() }}
          </div>
        }

        @if (isLoading()) {
          <div class="commerce-panel d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
            <p class="text-secondary mb-0">Loading products...</p>
          </div>
        } @else {
          <div class="row g-4">
            @for (product of products(); track product.id) {
              <div class="col-12 col-md-6 col-xl-4">
                <app-product-card [product]="product" (addToCart)="onAddToCart($event)"></app-product-card>
              </div>
            }
          </div>

          @if (!products().length) {
            <div class="commerce-panel text-center py-5">
              <h2 class="h4 fw-bold mb-2">No products available right now</h2>
              <p class="text-secondary mb-0">Please check back in a moment for restocked items.</p>
            </div>
          }
        }
      </div>
    </section>
  `
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadProducts();
  }

  protected onAddToCart(product: Product): void {
    const added = this.cartService.addToCart(product);

    if (added) {
      this.toastService.success(`${product.name} added to your cart.`, 'Cart updated');
      return;
    }

    this.toastService.warning(
      `You already have the maximum available quantity of ${product.name}.`,
      'Stock limit reached'
    );
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(error, 'Unable to load products. Please try again shortly.')
          );
          this.isLoading.set(false);
        }
      });
  }
}
