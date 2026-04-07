import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import { ROLE_HOME_ROUTE } from '../../../../core/config/navigation.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload = this.form.getRawValue();

    this.authService
      .login(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (user) => {
          this.form.markAsPristine();
          const role = user.role?.name;

          if (role === 'ADMIN' || role === 'CASHIER') {
            this.router.navigateByUrl(ROLE_HOME_ROUTE[role]);
            return;
          }

          this.router.navigateByUrl('/login');
        },
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        },
      });
  }

  hasFieldError(fieldName: 'username' | 'password', errorCode: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.touched && field.hasError(errorCode);
  }

  private resolveErrorMessage(error: unknown): string {
    const defaultMessage = 'No se pudo iniciar sesión. Intenta nuevamente.';

    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    const httpError = error as {
      error?: {
        message?: string;
      };
      status?: number;
    };

    const message = httpError.error?.message?.toLowerCase();

    if (message?.includes('invalid username') || message?.includes('invalid password')) {
    return 'Usuario o contraseña incorrectos.';
    }

    if (httpError.status === 401) {
      return httpError.error?.message || 'Usuario o contraseña incorrectos.';
    }

    if (httpError.status === 403) {
      return httpError.error?.message || 'No tienes permisos para acceder.';
    }

    if (httpError.status === 400) {
      return httpError.error?.message || 'Datos inválidos. Revisa los campos.';
    }

    if (httpError.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    return httpError.error?.message || defaultMessage;
  }
}