import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { Product } from '../../models/product.interface';
import { ProductsListResponse } from '../../models/products-list-response.interface';
import { ProductsService } from '../../services/products';
import { ProductFormModal } from '../../components/product-form-modal/product-form-modal';
import { ProductStatusToggle } from '../../components/product-status-toggle/product-status-toggle';

import { CategoriesService } from '../../../categories/services/categories';
import { Category } from '../../../categories/models/category.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    ProductFormModal,
    ProductStatusToggle,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly isLoading = signal(true);
  readonly isLoadingCategories = signal(false);
  readonly isStatusLoading = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly selectedCategoryId = signal<string>('');
  readonly searchTerm = signal('');

  readonly filteredProducts = signal<Product[]>([]);

  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly selectedProduct = signal<Product | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const categoryId = this.selectedCategoryId().trim();

    this.productsService
      .getProducts(targetPage, this.limit(), {
        category_id: categoryId || undefined,
      })
      .subscribe({
        next: (response: ProductsListResponse) => {
          const sortedProducts = [...response.data].sort((a, b) => {
            if (a.is_active !== b.is_active) {
              return a.is_active ? -1 : 1;
            }

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          this.products.set(sortedProducts);
          this.applySearchFilter();
          this.page.set(response.meta.page);
          this.limit.set(response.meta.limit);
          this.total.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar la lista de productos.'
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.categoriesService
      .getCategories(1, 100, { is_active: true })
      .subscribe({
        next: (response) => {
          this.categories.set(response.data);
          this.isLoadingCategories.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message || 'No se pudieron cargar las categorías activas.'
          );
          this.isLoadingCategories.set(false);
        },
      });
  }

  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategoryId.set(target.value);
    this.loadProducts(1);
  }

  onSearchTermChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applySearchFilter();
  }

  clearSearchTerm(): void {
    this.searchTerm.set('');
    this.applySearchFilter();
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId.set('');
    this.loadProducts(1);
  }

  openCreateModal(): void {
    this.selectedProduct.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(product: Product): void {
    if (!product.is_active) {
      return;
    }

    this.selectedProduct.set(product);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  handleCreated(): void {
    this.isCreateModalOpen.set(false);
    this.loadProducts(this.page());
  }

  handleUpdated(): void {
    this.isEditModalOpen.set(false);
    this.selectedProduct.set(null);
    this.loadProducts(this.page());
  }

  toggleProductStatus(product: Product): void {
    this.isStatusLoading.set(product.id);

    this.productsService
      .updateProductStatus(product.id, { is_active: !product.is_active })
      .subscribe({
        next: () => {
          this.isStatusLoading.set(null);
          this.loadProducts(this.page());
        },
        error: (error: HttpErrorResponse) => {
          this.isStatusLoading.set(null);
          this.errorMessage.set(
            error.error?.message || 'No se pudo actualizar el estado del producto.'
          );
        },
      });
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadProducts(this.page() - 1);
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadProducts(this.page() + 1);
  }

  private applySearchFilter(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const items = this.products();

    if (!term) {
      this.filteredProducts.set(items);
      return;
    }

    this.filteredProducts.set(
      items.filter((product) =>
        product.name.toLowerCase().includes(term)
      )
    );
  }

  getCategoryTypeLabel(type: string): string {
    switch (type) {
      case 'MAIN_DISH':
        return 'Plato principal';
      case 'DRINK':
        return 'Bebida';
      case 'EXTRA':
        return 'Extra';
      case 'SWEET':
        return 'Dulce';
      default:
        return type;
    }
  }

  getProductInitial(name?: string | null): string {
    if (!name) {
      return 'P';
    }

    return name.trim().charAt(0).toUpperCase();
  }
}