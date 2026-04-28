import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AuthResponse,
  LoginPayload,
  SignupPayload,
  SignupResponse
} from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly apiBaseUrl = environment.api.authBaseUrl;
  private readonly loginUrl = `${this.apiBaseUrl}/login`;
  private readonly signupUrl = `${this.apiBaseUrl}/signup`;
  private readonly tokenStorageKey = 'auth_token';
  private readonly tokenState = signal<string | null>(this.readStoredToken());

  readonly isAuthenticated = computed(() => !!this.tokenState());

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.loginUrl, payload).pipe(
      tap((response) => {
        const token = this.extractToken(response);

        if (!token) {
          throw new Error('Authentication token missing from login response.');
        }

        this.storeToken(token);
      })
    );
  }

  signup(payload: SignupPayload): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(this.signupUrl, payload);
  }

  logout(): void {
    if (this.canUseStorage()) {
      localStorage.removeItem(this.tokenStorageKey);
    }

    this.tokenState.set(null);
  }

  getToken(): string | null {
    return this.tokenState();
  }

  getCurrentUserId(): string {
    const token = this.getToken();

    if (!token) {
      return 'mock-user';
    }

    const payload = this.decodeTokenPayload(token);
    const userId = payload?.['userId'] ?? payload?.['id'] ?? payload?.['sub'];

    return typeof userId === 'string' && userId.trim().length > 0 ? userId : 'mock-user';
  }

  private storeToken(token: string): void {
    this.tokenState.set(token);

    if (this.canUseStorage()) {
      localStorage.setItem(this.tokenStorageKey, token);
    }
  }

  private extractToken(response: AuthResponse): string | null {
    const tokenCandidates = [response.token, response.accessToken, response.jwt];

    return (
      tokenCandidates.find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      ) ?? null
    );
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readStoredToken(): string | null {
    return this.canUseStorage() ? localStorage.getItem(this.tokenStorageKey) : null;
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    if (!this.canUseStorage()) {
      return null;
    }

    try {
      const payloadSegment = token.split('.')[1];

      if (!payloadSegment) {
        return null;
      }

      const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
      const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + paddingLength, '=');
      const decodedPayload = atob(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload);

      return parsedPayload && typeof parsedPayload === 'object'
        ? (parsedPayload as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}
