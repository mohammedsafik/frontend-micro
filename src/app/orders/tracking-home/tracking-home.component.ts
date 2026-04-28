import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-tracking-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-shell commerce-page tracking-page">
      <div class="container py-2 py-md-4">
        <section class="tracking-hero mb-4 mb-md-5">
          <div class="row align-items-center g-4">
            <div class="col-12 col-lg-7">
              <span class="brand-badge mb-3 d-inline-flex">Live Order Tracking</span>
              <h1 class="tracking-hero-title mb-3">Track your order from a dedicated page</h1>
              <p class="tracking-hero-copy mb-4">
                Enter an order ID to open live tracking, watch status refresh automatically, and
                keep product names visible while the order moves forward.
              </p>

              <div class="tracking-pill-row">
                @for (feature of heroFeatures; track feature) {
                  <span class="tracking-pill">{{ feature }}</span>
                }
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <div class="tracking-callout-card">
                <p class="tracking-callout-label mb-2">Recent order access</p>
                <div class="tracking-callout-value mb-2">
                  {{ recentOrderId || 'No order tracked yet' }}
                </div>
                <p class="tracking-callout-copy mb-0">
                  Your latest tracked order is saved locally so you can jump back into live
                  updates without digging through checkout again.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div class="row g-4 align-items-start">
          <div class="col-12 col-xl-7">
            <section class="commerce-panel p-4 p-md-5">
              <span class="tracking-section-kicker">Open live tracking</span>
              <h2 class="h3 fw-bold mb-2">Enter an order ID</h2>
              <p class="text-secondary mb-4">
                Paste the order number you received after checkout to open the live tracking view.
              </p>

              <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                <div>
                  <label class="form-label fw-semibold" for="orderId">Order ID</label>
                  <input
                    id="orderId"
                    type="text"
                    class="form-control tracking-input"
                    [class.is-invalid]="isInvalid()"
                    formControlName="orderId"
                    autocomplete="off"
                    placeholder="Paste your order id"
                  />

                  @if (isInvalid()) {
                    <div class="invalid-feedback d-block">Order ID is required.</div>
                  }
                </div>

                <div class="d-flex flex-column flex-sm-row gap-3">
                  <button class="btn btn-primary btn-lg" type="submit">Start live tracking</button>
                  <a class="btn btn-outline-primary btn-lg" routerLink="/products">Browse products</a>
                </div>
              </form>
            </section>
          </div>

          <div class="col-12 col-xl-5">
            <div class="tracking-side-stack">
              <section class="commerce-panel p-4">
                <span class="tracking-section-kicker">Quick return</span>
                <h2 class="h4 fw-bold mb-2">Resume your latest tracked order</h2>
                <p class="text-secondary mb-4">
                  Jump back into the most recent live order view saved on this device.
                </p>

                @if (recentOrderId) {
                  <div class="tracking-recent-card">
                    <div>
                      <p class="text-secondary text-uppercase small fw-semibold mb-1">Latest order</p>
                      <strong class="tracking-recent-id">{{ recentOrderId }}</strong>
                    </div>
                    <a class="btn btn-primary" [routerLink]="['/tracking', recentOrderId]">
                      Open tracking
                    </a>
                  </div>
                } @else {
                  <div class="tracking-empty-card">
                    <strong class="d-block mb-2">No recent order stored yet</strong>
                    <p class="text-secondary mb-0 small">
                      Place an order from the cart and it will appear here automatically.
                    </p>
                  </div>
                }
              </section>

              <section class="commerce-panel p-4">
                <span class="tracking-section-kicker">What this page gives you</span>
                <div class="tracking-feature-grid mt-3">
                  @for (feature of trackerFeatures; track feature.title) {
                    <article class="tracking-feature-card">
                      <strong class="d-block mb-2">{{ feature.title }}</strong>
                      <p class="text-secondary small mb-0">{{ feature.description }}</p>
                    </article>
                  }
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class TrackingHomeComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  protected readonly recentOrderId = this.orderService.getLastTrackedOrderId();
  protected readonly heroFeatures = [
    'Dedicated tracking hub',
    '4-second live refresh',
    'Product names stay visible'
  ];
  protected readonly trackerFeatures = [
    {
      title: 'Live refresh',
      description: 'Order status updates automatically every few seconds without manual reloads.'
    },
    {
      title: 'Readable items',
      description: 'Tracked orders keep product names and item details visible during polling.'
    },
    {
      title: 'Fast return',
      description: 'The most recent order id is stored locally for quick reopening from this page.'
    }
  ];

  protected readonly form = this.fb.group({
    orderId: ['', Validators.required]
  });

  protected onSubmit(): void {
    const orderId = this.form.controls.orderId.value.trim();

    if (!orderId) {
      this.form.controls.orderId.markAsTouched();
      return;
    }

    this.orderService.rememberTrackedOrderId(orderId);
    void this.router.navigate(['/tracking', orderId]);
  }

  protected isInvalid(): boolean {
    const control = this.form.controls.orderId;

    return control.invalid && (control.touched || control.dirty);
  }
}
