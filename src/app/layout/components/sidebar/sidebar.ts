import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../../core/services/session';
import { NAVIGATION_ITEMS } from '../../../core/config/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly sessionService = inject(SessionService);

  readonly isOpen = input<boolean>(true);
  readonly currentRole = input<string | null>(null);

  readonly currentUser = computed(() => this.sessionService.currentUser());

  readonly navigationItems = computed(() => {
    const role = this.currentRole();
    if (!role) {
      return [];
    }

    return NAVIGATION_ITEMS.filter((item) => item.roles.includes(role as 'ADMIN' | 'CASHIER'));
  });
}