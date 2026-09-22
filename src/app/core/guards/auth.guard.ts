import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guards the Orders tab so only a signed-in user can view it.
 *
 * This is a frontend navigation guard only — it hides the route in the
 * Angular app but does not, by itself, secure the backend. The CampusEats
 * API does not currently require a token on /api/orders; this guard exists
 * to practise the Angular routing pattern, per the Part 2 brief.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
