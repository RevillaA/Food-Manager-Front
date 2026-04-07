import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { UsersService } from '../../services/users';
import { SessionService } from '../../../../core/services/session';
import { User } from '../../models/user.interface';
import { UserFormModal } from '../../components/user-form-modal/user-form-modal';
import { UserStatusToggle } from '../../components/user-status-toggle/user-status-toggle';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, DatePipe, UserFormModal, UserStatusToggle],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly sessionService = inject(SessionService);

  readonly isLoading = signal(true);
  readonly isStatusLoading = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly users = signal<User[]>([]);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly selectedUser = signal<User | null>(null);

  readonly currentUser = computed(() => this.sessionService.currentUser());

  readonly visibleUsers = computed(() => {
    const currentUserId = this.currentUser()?.id;
    return this.users().filter((user) => user.id !== currentUserId);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(targetPage = this.page()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersService.getUsers(targetPage, this.limit()).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.page.set(response.meta.page);
        this.limit.set(response.meta.limit);
        this.total.set(response.meta.total);
        this.totalPages.set(response.meta.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'No se pudo cargar la lista de usuarios.'
        );
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.selectedUser.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(user: User): void {
    if (this.isSelfUser(user)) {
      return;
    }

    this.selectedUser.set(user);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedUser.set(null);
  }

  handleCreated(): void {
    this.isCreateModalOpen.set(false);
    this.loadUsers(this.page());
  }

  handleUpdated(): void {
    this.isEditModalOpen.set(false);
    this.selectedUser.set(null);
    this.loadUsers(this.page());
  }

  toggleUserStatus(user: User): void {
    if (this.isSelfUser(user)) {
      return;
    }

    this.isStatusLoading.set(user.id);

    this.usersService
      .updateUserStatus(user.id, { is_active: !user.is_active })
      .subscribe({
        next: () => {
          this.isStatusLoading.set(null);
          this.loadUsers(this.page());
        },
        error: (error) => {
          this.isStatusLoading.set(null);
          this.errorMessage.set(
            error?.error?.message || 'No se pudo actualizar el estado del usuario.'
          );
        },
      });
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadUsers(this.page() - 1);
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadUsers(this.page() + 1);
  }

  isSelfUser(user: User): boolean {
    return user.id === this.currentUser()?.id;
  }

  getRoleLabel(role?: string | null): string {
    const rolesMap: Record<string, string> = {
      ADMIN: 'Administrador',
      CASHIER: 'Cajero',
    };

    return role ? rolesMap[role] ?? role : '';
  }

  getUserInitial(fullName?: string | null): string {
    if (!fullName) {
      return 'U';
    }

    return fullName.trim().charAt(0).toUpperCase();
  }
}