import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { LoginPayload } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/error-message.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-shell d-flex align-items-center justify-content-center">
      <div class="auth-card card border-0">
        <div class="card-body p-10 p-md-10">
          <span class="brand-badge mb-3 d-inline-flex">Welcome to finest coder</span>
          <h1 class="h3 fw-bold mb-2">Welcome back</h1>
          <p class="text-secondary mb-4">
            Log in to browse products, manage your cart, and track live orders.
          </p>

          @if (successMessage) {
            <div class="alert alert-success" role="alert">
              {{ successMessage }}
            </div>
          }

          @if (errorMessage) {
            <div class="alert alert-danger" role="alert">
              {{ errorMessage }}
            </div>
          }

          <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div>
              <label class="form-label fw-semibold" for="email">Email address</label>
              <input
                id="email"
                type="email"
                class="form-control"
                [class.is-invalid]="isInvalid('email')"
                formControlName="email"
                autocomplete="email"
                placeholder="you@example.com"
              />

              @if (isInvalid('email')) {
                <div class="invalid-feedback d-block">{{ getErrorMessage('email') }}</div>
              }
            </div>

            <div>
              <label class="form-label fw-semibold" for="password">Password</label>
              <input
                id="password"
                type="password"
                class="form-control"
                [class.is-invalid]="isInvalid('password')"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password"
              />

              @if (isInvalid('password')) {
                <div class="invalid-feedback d-block">{{ getErrorMessage('password') }}</div>
              }
            </div>

            <button class="btn btn-primary btn-lg mt-2" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Signing in...' : 'Login' }}
            </button>
          </form>

          <p class="text-secondary text-center mb-0 mt-4">
            Don't have an account?
            <a class="fw-semibold text-decoration-none" routerLink="/signup">Create one</a>
          </p>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected errorMessage = '';
  protected readonly successMessage =
    this.route.snapshot.queryParamMap.get('registered') === 'true'
      ? 'Signup successful. Please log in with your new account.'
      : '';

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting.set(true);

    const payload: LoginPayload = this.form.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/products';

    this.authService
      .login(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(
            error,
            'Unable to log in. Please check your credentials and try again.'
          );
        }
      });
  }

  protected isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  protected getErrorMessage(controlName: 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (control.hasError('required')) {
      return `${this.toLabel(controlName)} is required.`;
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return 'Please review this field.';
  }

  private toLabel(controlName: 'email' | 'password'): string {
    return controlName === 'email' ? 'Email' : 'Password';
  }
}
