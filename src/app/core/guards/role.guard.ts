import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '../models/utilisateur.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Garde par role : {@code roleGuard('admin', 'superadmin')}.
 * Comme la garde d'authentification, elle ne fait que masquer une page :
 * la matrice des droits est appliquee par l'API.
 */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notifications = inject(NotificationService);

    const role = auth.role();
    if (role !== null && roles.includes(role)) {
      return true;
    }

    if (role === null) {
      return router.createUrlTree(['/connexion']);
    }

    notifications.avertissement("Vous n'avez pas acces a cette page.");
    return router.createUrlTree(['/tableau-de-bord']);
  };
}
