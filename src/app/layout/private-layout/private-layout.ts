import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth';
import { SessionService } from '../../core/services/session';
import { Sidebar } from '../components/sidebar/sidebar';
import { Topbar } from '../components/topbar/topbar';
import { ROLE_HOME_ROUTE } from '../../core/config/navigation.config';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  templateUrl: './private-layout.html',
  styleUrl: './private-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSidebarOpen = signal(true);

  readonly currentUser = computed(() => this.sessionService.currentUser());
  readonly currentRole = computed(() => this.currentUser()?.role?.name ?? null);

  ngOnInit(): void {
    this.authService.restoreSession().subscribe({
      next: (user) => {
        this.isLoading.set(false);

        if (!user) {
          this.router.navigateByUrl('/login');
          return;
        }

        const currentUrl = this.router.url;

        if (currentUrl === '/app' || currentUrl === '/app/') {
          const role = user.role?.name;
          if (role === 'ADMIN' || role === 'CASHIER') {
            this.router.navigateByUrl(ROLE_HOME_ROUTE[role]);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/login');
      },
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }
}