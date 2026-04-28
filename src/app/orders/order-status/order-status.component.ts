import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, filter, switchMap, timer } from 'rxjs';

import { Order } from '../../models/commerce.models';
import { getApiErrorMessage } from '../../core/utils/error-message.util';
import { OrderService } from '../../services/order.service';
import { OrderPageComponent } from '../order-page/order-page.component';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [OrderPageComponent],
  template: `
    <app-order-page
      [order]="order()"
      [isLoading]="isLoading()"
      [isRefreshing]="isRefreshing()"
      [errorMessage]="errorMessage()"
    ></app-order-page>
  `
})
export class OrderStatusComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isRefreshing = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.startPolling();
  }

  private startPolling(): void {
    this.route.paramMap
      .pipe(
        filter((params) => params.has('id')),
        switchMap((params) => {
          const orderId = params.get('id') as string;
          this.order.set(null);
          this.isLoading.set(true);
          this.isRefreshing.set(false);
          this.errorMessage.set('');

          return timer(0, 4000).pipe(
            switchMap((tick) => {
              this.isRefreshing.set(tick > 0);

              return this.orderService.getOrderById(orderId).pipe(
                catchError((error: unknown) => {
                  this.errorMessage.set(
                    getApiErrorMessage(error, 'Unable to fetch the latest order status right now.')
                  );
                  this.isLoading.set(false);
                  this.isRefreshing.set(false);

                  return EMPTY;
                })
              );
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.isLoading.set(false);
          this.isRefreshing.set(false);
          this.errorMessage.set('');
        }
      });
  }
}
