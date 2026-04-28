import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly nextId = signal(1);

  readonly toasts = signal<ToastMessage[]>([]);

  success(message: string, title = 'Success'): void {
    this.show({ message, title, variant: 'success' });
  }

  error(message: string, title = 'Error'): void {
    this.show({ message, title, variant: 'danger' });
  }

  info(message: string, title = 'Notice'): void {
    this.show({ message, title, variant: 'info' });
  }

  warning(message: string, title = 'Warning'): void {
    this.show({ message, title, variant: 'warning' });
  }

  dismiss(id: number): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const id = this.nextId();
    this.nextId.update((currentId) => currentId + 1);
    this.toasts.update((items) => [...items, { id, ...toast }]);

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.dismiss(id), 3000);
    }
  }
}
