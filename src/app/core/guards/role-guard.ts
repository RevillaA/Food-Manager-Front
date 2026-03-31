import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

import { SessionService } from '../services/session';
import { ROLE_HOME_ROUTE } from '../config/navigation.config';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const user = sessionService.getUser();
  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  const userRole = user.role?.name;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  if (userRole === 'ADMIN' || userRole === 'CASHIER') {
    return router.createUrlTree([ROLE_HOME_ROUTE[userRole]]);
  }

  return router.createUrlTree(['/login']);
};