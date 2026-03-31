import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { UsersService } from '../../services/users';
import { User } from '../../models/user.interface';
import { CreateUserRequest } from '../../models/create-user-request.interface';
import { UpdateUserRequest } from '../../models/update-user-request.interface';

type UserFormMode = 'create' | 'edit';

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form-modal.html',
  styleUrl: './user-form-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);

  readonly isOpen = input<boolean>(false);
  readonly mode = input<UserFormMode>('create');
  readonly user = input<User | null>(null);

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Crear usuario' : 'Editar usuario'
  );

  readonly submitLabel = computed(() =>
    this.mode() === 'create' ? 'Crear usuario' : 'Guardar cambios'
  );

  readonly roles = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Cajero', value: 'CASHIER' },
  ] as const;

  readonly form = this.fb.group({
    full_name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(120),
    ]),
    username: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
    ]),
    email: this.fb.control<string | null>('', [Validators.email, Validators.maxLength(120)]),
    password: this.fb.control<string>('', []),
    role_name: this.fb.nonNullable.control<'ADMIN' | 'CASHIER'>('CASHIER', [
      Validators.required,
    ]),
  });

  syncFormState(): void {
    const currentMode = this.mode();
    const currentUser = this.user();

    this.errorMessage.set(null);

    if (currentMode === 'create') {
      this.form.reset({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role_name: 'CASHIER',
      });

      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
      ]);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      return;
    }

    this.form.reset({
      full_name: currentUser?.full_name ?? '',
      username: currentUser?.username ?? '',
      email: currentUser?.email ?? '',
      password: '',
      role_name: (currentUser?.role?.name as 'ADMIN' | 'CASHIER') ?? 'CASHIER',
    });

    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  close(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.closed.emit();
  }

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

    if (this.mode() === 'create') {
      const payload: CreateUserRequest = {
        full_name: this.form.controls.full_name.getRawValue().trim(),
        username: this.form.controls.username.getRawValue().trim(),
        email: this.normalizeOptionalText(this.form.controls.email.getRawValue()),
        password: this.form.controls.password.getRawValue() ?? '',
        role_name: this.form.controls.role_name.getRawValue(),
      };

      this.usersService
        .createUser(payload)
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: () => {
            this.saved.emit();
          },
          error: (error) => {
            this.errorMessage.set(this.resolveErrorMessage(error));
          },
        });

      return;
    }

    const currentUser = this.user();

    if (!currentUser) {
      this.isSubmitting.set(false);
      this.errorMessage.set('No se encontró el usuario a editar.');
      return;
    }

    const payload: UpdateUserRequest = {
      full_name: this.form.controls.full_name.getRawValue().trim(),
      username: this.form.controls.username.getRawValue().trim(),
      email: this.normalizeOptionalText(this.form.controls.email.getRawValue()),
      role_name: this.form.controls.role_name.getRawValue(),
    };

    this.usersService
      .updateUser(currentUser.id, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.saved.emit();
        },
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        },
      });
  }

  hasFieldError(
    fieldName: 'full_name' | 'username' | 'email' | 'password' | 'role_name',
    errorCode: string
  ): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.touched && field.hasError(errorCode);
  }

  private normalizeOptionalText(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private resolveErrorMessage(error: unknown): string {
    const defaultMessage = 'No se pudo guardar el usuario. Intenta nuevamente.';

    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 409) {
      return httpError.error?.message || 'Ya existe un usuario con esos datos.';
    }

    if (httpError.status === 400) {
      return httpError.error?.message || 'Datos inválidos. Revisa el formulario.';
    }

    if (httpError.status === 403) {
      return httpError.error?.message || 'No tienes permisos para realizar esta acción.';
    }

    return httpError.error?.message || defaultMessage;
  }
}