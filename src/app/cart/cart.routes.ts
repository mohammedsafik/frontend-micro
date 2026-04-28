import { Routes } from '@angular/router';

import { authGuard } from '../core/guards/auth.guard';

export const cartRoutes: Routes = [
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./cart-page/cart-page.component').then((m) => m.CartPageComponent)
  }
];
