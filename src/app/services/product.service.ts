import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Product, ProductApiModel } from '../models/commerce.models';
import { environment } from '../../environments/environment';

const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dbeafe" />
        <stop offset="100%" stop-color="#bfdbfe" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bg)" rx="24" />
    <circle cx="300" cy="160" r="72" fill="#2563eb" opacity="0.14" />
    <path d="M220 250h160c22 0 40 18 40 40v8H180v-8c0-22 18-40 40-40Z" fill="#2563eb" opacity="0.16"/>
    <text x="50%" y="54%" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#1d4ed8">
      Quick Commerce
    </text>
  </svg>
`)}`;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = environment.api.productsUrl;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<unknown>(this.productsUrl)
      .pipe(
        map((response) => this.extractProducts(response)),
        map((products) => products.map((product, index) => this.normalizeProduct(product, index)))
      );
  }

  private normalizeProduct(product: ProductApiModel, index: number): Product {
    const resolvedId = product.id || product._id || product.productId || `product-${index + 1}`;

    return {
      id: resolvedId,
      name: product.name?.trim() || product.productName?.trim() || product.title?.trim() || `Product ${index + 1}`,
      price: Number(product.price ?? product.salePrice ?? product.mrp ?? 0),
      image:
        product.image?.trim() ||
        product.imageUrl?.trim() ||
        product.thumbnail?.trim() ||
        DEFAULT_PRODUCT_IMAGE,
      stock: Math.max(0, Number(product.stock ?? product.quantity ?? product.inventory ?? product.inStock ?? 0)),
      description:
        product.description?.trim() ||
        product.details?.trim() ||
        'Fresh essentials delivered in minutes.'
    };
  }

  private extractProducts(response: unknown): ProductApiModel[] {
    if (Array.isArray(response)) {
      return response as ProductApiModel[];
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const objectResponse = response as Record<string, unknown>;

    for (const key of ['products', 'data', 'items', 'results', 'list']) {
      const value = objectResponse[key];

      if (Array.isArray(value)) {
        return value as ProductApiModel[];
      }

      if (value && typeof value === 'object') {
        const nestedProducts = this.extractProducts(value);

        if (nestedProducts.length) {
          return nestedProducts;
        }
      }
    }

    return [];
  }
}
