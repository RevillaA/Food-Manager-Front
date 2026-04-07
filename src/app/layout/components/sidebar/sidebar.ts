import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../../core/services/session';
import { NAVIGATION_ITEMS } from '../../../core/config/navigation.config';

type Role = 'ADMIN' | 'CASHIER';

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
    const role = this.currentRole() as Role | null;
    if (!role) return [];

    return NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));
  });

  readonly coreItems = computed(() => {
    const items = this.navigationItems();

    const order = [
      '/app/inicio',
      '/app/reportes',
      '/app/jornada',
      '/app/pedidos',
      '/app/ventas',
    ];

    return order
      .map((route) => items.find((item) => item.route === route))
      .filter((item): item is (typeof NAVIGATION_ITEMS)[number] => !!item);
  });

  readonly adminItems = computed(() => {
    const items = this.navigationItems();

    const order = [
      '/app/categorias',
      '/app/productos',
      '/app/usuarios',
      '/app/mi-cuenta',
    ];

    return order
      .map((route) => items.find((item) => item.route === route))
      .filter((item): item is (typeof NAVIGATION_ITEMS)[number] => !!item);
  });
}