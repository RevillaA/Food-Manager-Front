import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
  computed,
  effect,
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

import { CategoriesService } from '../../services/categories';
import { Category, CategoryType } from '../../models/category.interface';
import { CreateCategoryRequest } from '../../models/create-category-request.interface';
import { UpdateCategoryRequest } from '../../models/update-category-request.interface';

type CategoryFormMode = 'create' | 'edit';

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form-modal.html',
  styleUrl: './category-form-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);

  readonly isOpen = input<boolean>(false);
  readonly mode = input<CategoryFormMode>('create');
  readonly category = input<Category | null>(null);

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Crear categoría' : 'Editar categoría'
  );

  readonly submitLabel = computed(() =>
    this.mode() === 'create' ? 'Crear categoría' : 'Guardar cambios'
  );

  readonly categoryTypes = [
    { label: 'Plato principal', value: 'MAIN_DISH' },
    { label: 'Bebida', value: 'DRINK' },
    { label: 'Extra', value: 'EXTRA' },
    { label: 'Dulce', value: 'SWEET' },
  ] as const satisfies ReadonlyArray<{ label: string; value: CategoryType }>;

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    category_type: this.fb.nonNullable.control<CategoryType>('MAIN_DISH', [
      Validators.required,
    ]),
    description: this.fb.control<string | null>('', [Validators.maxLength(200)]),
  });

  constructor() {
    effect(
      () => {
        const open = this.isOpen();
        const currentMode = this.mode();
        const currentCategory = this.category();

        void currentMode;
        void currentCategory;

        if (!open) {
          return;
        }

        this.syncFormState();
      },
      { allowSignalWrites: true }
    );
  }

  syncFormState(): void {
    const currentMode = this.mode();
    const currentCategory = this.category();

    this.errorMessage.set(null);

    if (currentMode === 'create') {
      this.form.reset({
        name: '',
        category_type: 'MAIN_DISH',
        description: '',
      });

      this.form.markAsPristine();
      this.form.markAsUntouched();
      return;
    }

    this.form.reset({
      name: currentCategory?.name ?? '',
      category_type: currentCategory?.category_type ?? 'MAIN_DISH',
      description: currentCategory?.description ?? '',
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  close(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (!this.isOpen()) {
      return;
    }

    this.close();
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
      const payload: CreateCategoryRequest = {
        name: this.form.controls.name.getRawValue().trim(),
        category_type: this.form.controls.category_type.getRawValue(),
        description: this.normalizeOptionalText(this.form.controls.description.getRawValue()),
      };

      this.categoriesService
        .createCategory(payload)
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

    const currentCategory = this.category();

    if (!currentCategory) {
      this.isSubmitting.set(false);
      this.errorMessage.set('No se encontró la categoría a editar.');
      return;
    }

    const payload: UpdateCategoryRequest = {
      name: this.form.controls.name.getRawValue().trim(),
      category_type: this.form.controls.category_type.getRawValue(),
      description: this.normalizeOptionalText(this.form.controls.description.getRawValue()),
    };

    this.categoriesService
      .updateCategory(currentCategory.id, payload)
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
    fieldName: 'name' | 'category_type' | 'description',
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
    const defaultMessage = 'No se pudo guardar la categoría. Intenta nuevamente.';

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
      return httpError.error?.message || 'El nombre de la categoría ya existe.';
    }

    if (httpError.status === 400) {
      return httpError.error?.message || 'Datos inválidos. Revisa el formulario.';
    }

    if (httpError.status === 403) {
      return httpError.error?.message || 'No tienes permisos para realizar esta acción.';
    }

    if (httpError.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    return httpError.error?.message || defaultMessage;
  }
}
