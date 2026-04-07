import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthenticatedUser } from '../../../features/auth/models/authenticated-user.interface';
import { AuthService } from '../../../features/auth/services/auth';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = input<AuthenticatedUser | null>(null);

  @Output() toggleSidebar = new EventEmitter<void>();

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  getRoleLabel(role?: string | null): string {
    if (!role) return '';

    const rolesMap: Record<string, string> = {
      ADMIN: 'Administrador',
      CASHIER: 'Cajero',
    };

    return rolesMap[role] ?? role;
  }
}