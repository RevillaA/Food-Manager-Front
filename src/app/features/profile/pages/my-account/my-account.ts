import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-my-account',
  standalone: true,
  templateUrl: './my-account.html',
  styleUrl: './my-account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyAccount {
  private readonly sessionService = inject(SessionService);

  readonly user = computed(() => this.sessionService.currentUser());

  getRoleLabel(role?: string | null): string {
    const rolesMap: Record<string, string> = {
      ADMIN: 'Administrador',
      CASHIER: 'Cajero',
    };

    return role ? rolesMap[role] ?? role : '';
  }
}