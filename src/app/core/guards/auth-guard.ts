import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { TokenService } from '../services/token';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};