import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SignupPayload } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/error-message.util';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-shell d-flex align-items-center justify-content-center">
      <div class="auth-card card border-0">
        <div class="card-body p-4 p-md-5">
          <span class="brand-badge mb-3 d-inline-flex">New Account</span>
          <h1 class="h3 fw-bold mb-2">Create your account</h1>
          <p class="text-secondary mb-4">
            Sign up to start ordering, tracking, and managing your quick-commerce basket.
          </p>

          @if (errorMessage) {
            <div class="alert alert-danger" role="alert">
              {{ errorMessage }}
            </div>
          }

          <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div>
              <label class="form-label fw-semibold" for="name">Full name</label>
              <input
                id="name"
                type="text"
                class="form-control"
                [class.is-invalid]="isInvalid('name')"
                formControlName="name"
                autocomplete="name"
                placeholder="Jane Doe"
              />

              @if (isInvalid('name')) {
                <div class="invalid-feedback d-block">{{ getErrorMessage('name') }}</div>
              }
            </div>

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
                autocomplete="new-password"
                placeholder="Minimum 6 characters"
              />

              @if (isInvalid('password')) {
                <div class="invalid-feedback d-block">{{ getErrorMessage('password') }}</div>
              }
            </div>

            <button class="btn btn-primary btn-lg mt-2" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Creating account...' : 'Signup' }}
            </button>
          </form>

          <p class="text-secondary text-center mb-0 mt-4">
            Already have an account?
            <a class="fw-semibold text-decoration-none" routerLink="/login">Log in</a>
          </p>
        </div>
      </div>
    </section>
  `
})
export class SignupComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected errorMessage = '';

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting.set(true);

    const payload: SignupPayload = this.form.getRawValue();

    this.authService
      .signup(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({
            name: '',
            email: '',
            password: ''
          });

          void this.router.navigate(['/login'], {
            queryParams: {
              registered: 'true'
            }
          });
        },
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(
            error,
            'Unable to create your account right now. Please try again.'
          );
        }
      });
  }

  protected isInvalid(controlName: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.touched || control.dirty);
  }

  protected getErrorMessage(controlName: 'name' | 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (control.hasError('required')) {
      return `${this.toLabel(controlName)} is required.`;
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters long.';
    }

    return 'Please review this field.';
  }

  private toLabel(controlName: 'name' | 'email' | 'password'): string {
    if (controlName === 'name') {
      return 'Name';
    }

    if (controlName === 'email') {
      return 'Email';
    }

    return 'Password';
  }
}
