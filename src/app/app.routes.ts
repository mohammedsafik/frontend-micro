import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { cartRoutes } from './cart/cart.routes';
import { orderRoutes } from './orders/orders.routes';
import { productRoutes } from './products/products.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products'
  },
  ...authRoutes,
  ...productRoutes,
  ...cartRoutes,
  ...orderRoutes,
  ...dashboardRoutes,
  {
    path: '**',
    redirectTo: 'products'
  }
];
