import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../services/cart.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  template: `
    <section class="page-shell commerce-page dashboard-page">
      <div class="container py-2 py-md-4">
        <section class="dashboard-hero mb-4 mb-md-5">
          <div class="row align-items-center g-4">
            <div class="col-12 col-lg-7">
              <span class="brand-badge mb-3 d-inline-flex">Fresh picks for today</span>
              <h1 class="dashboard-hero-title mb-3">A storefront-style home for your everyday essentials</h1>
              <p class="dashboard-hero-copy mb-4">
                Shop curated baskets, refill your weekly staples, and jump into live order
                tracking with a dashboard that feels closer to a real commerce homepage.
              </p>

              <div class="dashboard-pill-row mb-4">
                @for (tag of heroTags; track tag) {
                  <span class="dashboard-pill">{{ tag }}</span>
                }
              </div>

              <div class="d-flex flex-column flex-sm-row gap-3">
                <a class="btn btn-primary btn-lg" routerLink="/products">Shop bestsellers</a>
                <a class="btn btn-outline-primary btn-lg" routerLink="/cart">
                  Open basket ({{ (cartCount$ | async) ?? 0 }})
                </a>
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <div class="dashboard-hero-panel">
                <p class="dashboard-mini-label mb-2">Express delivery window</p>
                <div class="dashboard-eta mb-2">18 min</div>
                <p class="dashboard-hero-panel-copy mb-4">
                  Average doorstep time for produce, pantry staples, chilled drinks, and snack
                  refills in your area.
                </p>

                <div class="dashboard-stat-grid">
                  @for (stat of heroStats; track stat.label) {
                    <div class="dashboard-stat-card">
                      <span class="dashboard-stat-value">{{ stat.value }}</span>
                      <span class="dashboard-stat-label">{{ stat.label }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="row g-4 mb-4">
          <div class="col-12 col-md-6 col-xl-3">
            <article class="dashboard-metric-card">
              <span class="dashboard-metric-label">Session</span>
              <strong class="dashboard-metric-value">
                {{ isAuthenticated() ? 'Active' : 'Offline' }}
              </strong>
              <p class="dashboard-metric-copy mb-0">
                Your sign-in is ready for protected shopping, cart updates, and checkout.
              </p>
            </article>
          </div>

          <div class="col-12 col-md-6 col-xl-3">
            <article class="dashboard-metric-card">
              <span class="dashboard-metric-label">Basket items</span>
              <strong class="dashboard-metric-value">{{ (cartCount$ | async) ?? 0 }}</strong>
              <p class="dashboard-metric-copy mb-0">
                Keep building your cart and place an order whenever you are ready.
              </p>
            </article>
          </div>

          <div class="col-12 col-md-6 col-xl-3">
            <article class="dashboard-metric-card">
              <span class="dashboard-metric-label">Live refresh</span>
              <strong class="dashboard-metric-value">4 sec</strong>
              <p class="dashboard-metric-copy mb-0">
                Order tracking refreshes automatically so status changes stay visible.
              </p>
            </article>
          </div>

          <div class="col-12 col-md-6 col-xl-3">
            <article class="dashboard-metric-card">
              <span class="dashboard-metric-label">Checkout flow</span>
              <strong class="dashboard-metric-value">1 tap</strong>
              <p class="dashboard-metric-copy mb-0">
                Browse, add to cart, and launch live tracking as soon as an order is placed.
              </p>
            </article>
          </div>
        </div>

        <div class="row g-4 align-items-start">
          <div class="col-12 col-xl-8">
            <section class="commerce-panel p-4 p-md-5">
              <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
                <div>
                  <span class="dashboard-section-kicker">Shop by mission</span>
                  <h2 class="h3 fw-bold mb-2">Curated aisles with a real ecommerce feel</h2>
                  <p class="text-secondary mb-0">
                    Jump straight into the kind of basket you want to build today.
                  </p>
                </div>

                <a class="btn btn-outline-primary" routerLink="/products">See full catalog</a>
              </div>

              <div class="dashboard-category-grid">
                @for (collection of featuredCollections; track collection.title) {
                  <article class="dashboard-collection-card" [attr.data-tone]="collection.tone">
                    <span class="dashboard-collection-badge">{{ collection.badge }}</span>
                    <h3 class="h4 fw-bold mb-2">{{ collection.title }}</h3>
                    <p class="text-secondary mb-4">{{ collection.description }}</p>
                    <a class="dashboard-collection-link" [routerLink]="collection.route">
                      {{ collection.cta }}
                    </a>
                  </article>
                }
              </div>
            </section>
          </div>

          <div class="col-12 col-xl-4">
            <div class="dashboard-side-stack">
              <section class="commerce-panel p-4">
                <span class="dashboard-section-kicker">Account snapshot</span>
                <h2 class="h4 fw-bold mb-2">You are checkout-ready</h2>
                <p class="text-secondary mb-4">
                  Everything is in place to keep shopping, manage your basket, and start live
                  order tracking after checkout.
                </p>

                <div class="dashboard-account-rows">
                  <div class="dashboard-account-row">
                    <div>
                      <strong>Secure session</strong>
                      <p class="text-secondary mb-0 small">JWT is stored and ready for API calls</p>
                    </div>
                    <span class="dashboard-account-chip">Live</span>
                  </div>

                  <div class="dashboard-account-row">
                    <div>
                      <strong>Cart sync</strong>
                      <p class="text-secondary mb-0 small">Basket persists between page visits</p>
                    </div>
                    <span class="dashboard-account-chip">{{ (cartCount$ | async) ?? 0 }} items</span>
                  </div>

                  <div class="dashboard-account-row">
                    <div>
                      <strong>Order tracker</strong>
                      <p class="text-secondary mb-0 small">Product names stay visible during refresh</p>
                    </div>
                    <span class="dashboard-account-chip">Updated</span>
                  </div>
                </div>

                <div class="token-preview mt-4">
                  <p class="text-secondary text-uppercase small fw-semibold mb-2">JWT preview</p>
                  <code class="d-block text-break">{{ tokenPreview }}</code>
                </div>
              </section>

              <section class="commerce-panel p-4">
                <span class="dashboard-section-kicker">Fast actions</span>
                <div class="d-grid gap-3 mt-3">
                  <a class="dashboard-action-link" routerLink="/products">
                    <span>
                      <strong class="d-block mb-1">Start a new basket</strong>
                      <span class="text-secondary small">Browse groceries, drinks, and essentials</span>
                    </span>
                    <span class="dashboard-link-hint">Shop</span>
                  </a>

                  <a class="dashboard-action-link" routerLink="/cart">
                    <span>
                      <strong class="d-block mb-1">Review your bag</strong>
                      <span class="text-secondary small">Adjust quantities before checkout</span>
                    </span>
                    <span class="dashboard-link-hint">Cart</span>
                  </a>

                  <a class="dashboard-action-link" routerLink="/tracking">
                    <span>
                      <strong class="d-block mb-1">Track an existing order</strong>
                      <span class="text-secondary small">Open the dedicated live tracking page</span>
                    </span>
                    <span class="dashboard-link-hint">Track</span>
                  </a>

                  <button class="btn btn-primary w-100" type="button" (click)="logout()">
                    Logout
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly cartCount$ = this.cartService.cartCount$;
  protected readonly tokenPreview = this.buildTokenPreview();
  protected readonly heroTags = ['Seasonal fruit drops', 'Daily staples', 'Lightning-fast checkout'];
  protected readonly heroStats = [
    { value: '120+', label: 'active catalog picks' },
    { value: '4 sec', label: 'tracking refresh rate' },
    { value: '24/7', label: 'order visibility' },
    { value: '1 tap', label: 'cart to checkout flow' }
  ];
  protected readonly featuredCollections = [
    {
      badge: 'Breakfast refill',
      title: 'Morning essentials',
      description: 'Milk, bread, fruit, and coffee picks grouped for a fast first-hour restock.',
      cta: 'Build this basket',
      route: '/products',
      tone: 'citrus'
    },
    {
      badge: 'After-work restock',
      title: 'Dinner in a dash',
      description: 'Fresh produce, pantry staples, and add-on snacks for a smooth evening order.',
      cta: 'Shop dinner staples',
      route: '/products',
      tone: 'ocean'
    },
    {
      badge: 'Weekend mode',
      title: 'Movie-night picks',
      description: 'Chips, soft drinks, frozen bites, and comfort treats ready for one-click adding.',
      cta: 'See snack aisle',
      route: '/products',
      tone: 'sunset'
    },
    {
      badge: 'Always on',
      title: 'Track after checkout',
      description: 'Place your order and jump into live tracking with product names that remain visible.',
      cta: 'Open tracking page',
      route: '/tracking',
      tone: 'mint'
    }
  ];

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private buildTokenPreview(): string {
    const token = this.authService.getToken();

    if (!token) {
      return 'No token found in localStorage.';
    }

    if (token.length <= 24) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-12)}`;
  }
}
