import { Routes } from '@angular/router';

import { authGuard } from '../core/guards/auth.guard';

export const orderRoutes: Routes = [
  {
    path: 'tracking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./tracking-home/tracking-home.component').then((m) => m.TrackingHomeComponent)
  },
  {
    path: 'tracking/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./order-status/order-status.component').then((m) => m.OrderStatusComponent)
  },
  {
    path: 'orders/:id',
    pathMatch: 'full',
    redirectTo: 'tracking/:id'
  }
];
