import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { SessionService } from '../services/session';
import { ROLE_HOME_ROUTE } from '../config/navigation.config';

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const user = sessionService.getUser();

  if (!user) {
    return true;
  }

  const role = user.role?.name;

  if (role === 'ADMIN' || role === 'CASHIER') {
    return router.createUrlTree([ROLE_HOME_ROUTE[role]]);
  }

  return true;
};