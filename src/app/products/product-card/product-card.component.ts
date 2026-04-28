import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Product } from '../../models/commerce.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <article class="card product-card border-0 h-100">
      <img class="product-image" [src]="product.image" [alt]="product.name" />

      <div class="card-body d-flex flex-column p-4">
        <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h2 class="h5 fw-bold mb-1">{{ product.name }}</h2>
            <p class="text-secondary mb-0 small">{{ product.description }}</p>
          </div>

          <span class="badge rounded-pill text-bg-light stock-badge">
            {{ product.stock }} in stock
          </span>
        </div>

        <div class="mt-auto d-flex align-items-center justify-content-between gap-3">
          <div>
            <p class="text-secondary text-uppercase small fw-semibold mb-1">Price</p>
            <p class="h4 fw-bold mb-0">{{ product.price | currency: 'USD' }}</p>
          </div>

          <button
            class="btn btn-primary"
            type="button"
            [disabled]="product.stock === 0"
            (click)="addToCart.emit(product)"
          >
            {{ product.stock === 0 ? 'Out of stock' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    </article>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() readonly addToCart = new EventEmitter<Product>();
}
