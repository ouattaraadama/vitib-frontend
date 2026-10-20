import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Reserve la page de connexion aux personnes non connectees :
 * une session ouverte est renvoyee directement au tableau de bord.
 */
export const inviteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.estConnecte() ? router.createUrlTree(['/tableau-de-bord']) : true;
};
