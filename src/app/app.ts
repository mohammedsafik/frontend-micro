import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { ToastMessage, ToastService } from './core/services/toast.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly cartCount$ = this.cartService.cartCount$;
  protected readonly toasts = this.toastService.toasts;

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  protected dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }

  protected toastLabel(toast: ToastMessage): string {
    return `${toast.title}: ${toast.message}`;
  }
}
