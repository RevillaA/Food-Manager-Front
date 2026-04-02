import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  effect,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { Product } from '../../models/product.interface';
import { ProductsService } from '../../services/products';
import { CreateProductRequest } from '../../models/create-product-request.interface';
import { UpdateProductRequest } from '../../models/update-product-request.interface';

import { CategoriesService } from '../../../categories/services/categories';
import { Category } from '../../../categories/models/category.interface';

type ProductFormMode = 'create' | 'edit';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form-modal.html',
  styleUrl: './product-form-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly isOpen = input<boolean>(false);
  readonly mode = input<ProductFormMode>('create');
  readonly product = input<Product | null>(null);

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly isSubmitting = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Crear producto' : 'Editar producto'
  );

  readonly submitLabel = computed(() =>
    this.mode() === 'create' ? 'Crear producto' : 'Guardar cambios'
  );

  readonly form = this.fb.group({
    category_id: this.fb.nonNullable.control('', [Validators.required]),
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(120),
    ]),
    description: this.fb.control<string | null>('', [Validators.maxLength(250)]),
    base_price: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]),
  });

  private readonly formSyncEffect = effect(() => {
    const open = this.isOpen();
    const mode = this.mode();
    const product = this.product();

    if (open) {
      this.loadActiveCategories();
      this.syncFormState(mode, product);
    }
  });

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
      const payload: CreateProductRequest = {
        category_id: this.form.controls.category_id.getRawValue(),
        name: this.form.controls.name.getRawValue().trim(),
        description: this.normalizeOptionalText(this.form.controls.description.getRawValue()),
        base_price: Number(this.form.controls.base_price.getRawValue()),
      };

      this.productsService
        .createProduct(payload)
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: () => {
            this.saved.emit();
          },
          error: (error: HttpErrorResponse) => {
            this.errorMessage.set(this.resolveErrorMessage(error));
          },
        });

      return;
    }

    const currentProduct = this.product();

    if (!currentProduct) {
      this.isSubmitting.set(false);
      this.errorMessage.set('No se encontró el producto a editar.');
      return;
    }

    const payload: UpdateProductRequest = {
      category_id: this.form.controls.category_id.getRawValue(),
      name: this.form.controls.name.getRawValue().trim(),
      description: this.normalizeOptionalText(this.form.controls.description.getRawValue()),
      base_price: Number(this.form.controls.base_price.getRawValue()),
    };

    this.productsService
      .updateProduct(currentProduct.id, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.saved.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        },
      });
  }

  hasFieldError(
    fieldName: 'category_id' | 'name' | 'description' | 'base_price',
    errorCode: string
  ): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.touched && field.hasError(errorCode);
  }

  getCategoryTypeLabel(type: Category['category_type']): string {
    switch (type) {
      case 'MAIN_DISH':
        return 'Plato principal';
      case 'DRINK':
        return 'Bebida';
      case 'EXTRA':
        return 'Extra';
      default:
        return type;
    }
  }

  private syncFormState(mode: ProductFormMode, product: Product | null): void {
    this.errorMessage.set(null);

    if (mode === 'create') {
      this.form.reset({
        category_id: '',
        name: '',
        description: '',
        base_price: null,
      });
      return;
    }

    this.form.reset({
      category_id: product?.category.id ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      base_price: product?.base_price ?? null,
    });
  }

  private loadActiveCategories(): void {
    this.isLoadingCategories.set(true);

    this.categoriesService
      .getCategories(1, 100, { is_active: true })
      .pipe(finalize(() => this.isLoadingCategories.set(false)))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar las categorías activas.'
          );
        },
      });
  }

  private normalizeOptionalText(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return error.error?.message || 'Ya existe un producto con ese nombre en la categoría.';
    }

    if (error.status === 400) {
      return error.error?.message || 'Datos inválidos. Revisa el formulario.';
    }

    if (error.status === 403) {
      return error.error?.message || 'No tienes permisos para realizar esta acción.';
    }

    return error.error?.message || 'No se pudo guardar el producto.';
  }
}