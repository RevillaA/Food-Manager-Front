import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { Category } from '../../models/category.interface';
import { CategoriesListResponse } from '../../models/categories-list-response.interface';
import { CategoriesService } from '../../services/categories';
import { CategoryFormModal } from '../../components/category-form-modal/category-form-modal';
import { CategoryStatusToggle } from '../../components/category-status-toggle/category-status-toggle';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CategoryFormModal, CategoryStatusToggle],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList implements OnInit {
  private readonly categoriesService = inject(CategoriesService);

  readonly isLoading = signal(true);
  readonly isStatusLoading = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly selectedCategory = signal<Category | null>(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.categoriesService.getCategories(targetPage, this.limit()).subscribe({
      next: (response: CategoriesListResponse) => {
        this.categories.set(response.data);
        this.page.set(response.meta.page);
        this.limit.set(response.meta.limit);
        this.total.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar la lista de categorías.'
        );
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.selectedCategory.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(category: Category): void {
    if (!category.is_active) {
      return;
    }

    this.selectedCategory.set(category);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedCategory.set(null);
  }

  handleCreated(): void {
    this.isCreateModalOpen.set(false);
    this.loadCategories(this.page());
  }

  handleUpdated(): void {
    this.isEditModalOpen.set(false);
    this.selectedCategory.set(null);
    this.loadCategories(this.page());
  }

  toggleCategoryStatus(category: Category): void {
    this.isStatusLoading.set(category.id);

    this.categoriesService
      .updateCategoryStatus(category.id, { is_active: !category.is_active })
      .subscribe({
        next: () => {
          this.isStatusLoading.set(null);
          this.loadCategories(this.page());
        },
        error: (error: HttpErrorResponse) => {
          this.isStatusLoading.set(null);
          this.errorMessage.set(
            error.error?.message || 'No se pudo actualizar el estado de la categoría.'
          );
        },
      });
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadCategories(this.page() - 1);
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadCategories(this.page() + 1);
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

  getCategoryInitial(name?: string | null): string {
    if (!name) {
      return 'C';
    }

    return name.trim().charAt(0).toUpperCase();
  }
}