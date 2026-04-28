import { Routes } from '@angular/router';

import { authGuard } from '../core/guards/auth.guard';

export const productRoutes: Routes = [
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./product-list/product-list.component').then((m) => m.ProductListComponent)
  }
];
