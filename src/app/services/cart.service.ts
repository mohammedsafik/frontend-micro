import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { CartItem, Product } from '../models/commerce.models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'quick_commerce_cart';
  private readonly cartSubject = new BehaviorSubject<CartItem[]>(this.readInitialCart());

  readonly cartCount$ = this.cartSubject.pipe(
    map((items) => items.reduce((count, item) => count + item.qty, 0))
  );

  readonly totalPrice$ = this.cartSubject.pipe(
    map((items) => items.reduce((total, item) => total + item.price * item.qty, 0))
  );

  addToCart(product: Product): boolean {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find((item) => item.id === product.id);

    if (existingItem && existingItem.qty >= existingItem.stock) {
      return false;
    }

    const updatedCart = existingItem
      ? currentCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      : [...currentCart, { ...product, qty: 1 }];

    this.setCart(updatedCart);
    return true;
  }

  removeFromCart(productId: string): void {
    this.setCart(this.cartSubject.value.filter((item) => item.id !== productId));
  }

  increaseQuantity(productId: string): boolean {
    const currentCart = this.cartSubject.value;
    const targetItem = currentCart.find((item) => item.id === productId);

    if (!targetItem || targetItem.qty >= targetItem.stock) {
      return false;
    }

    this.setCart(
      currentCart.map((item) => (item.id === productId ? { ...item, qty: item.qty + 1 } : item))
    );

    return true;
  }

  decreaseQuantity(productId: string): void {
    const currentCart = this.cartSubject.value;
    const targetItem = currentCart.find((item) => item.id === productId);

    if (!targetItem) {
      return;
    }

    if (targetItem.qty <= 1) {
      this.removeFromCart(productId);
      return;
    }

    this.setCart(
      currentCart.map((item) => (item.id === productId ? { ...item, qty: item.qty - 1 } : item))
    );
  }

  getCart(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  getCartSnapshot(): CartItem[] {
    return this.cartSubject.value;
  }

  clearCart(): void {
    this.setCart([]);
  }

  private setCart(items: CartItem[]): void {
    this.cartSubject.next(items);

    if (this.canUseStorage()) {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
  }

  private readInitialCart(): CartItem[] {
    if (!this.canUseStorage()) {
      return [];
    }

    try {
      const storedCart = localStorage.getItem(this.storageKey);

      if (!storedCart) {
        return [];
      }

      const parsedCart = JSON.parse(storedCart) as CartItem[];

      if (!Array.isArray(parsedCart)) {
        return [];
      }

      return parsedCart
        .filter((item) => item && typeof item.id === 'string')
        .map((item) => ({
          ...item,
          stock: Math.max(0, Number(item.stock ?? 0)),
          price: Number(item.price ?? 0),
          qty: Math.max(1, Number(item.qty ?? 1))
        }));
    } catch {
      return [];
    }
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
