import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Garde des pages privees.
 *
 * Elle ne remplace jamais un controle serveur : l'API revalide le compte a
 * chaque requete. Elle evite simplement d'afficher une page vide a quelqu'un
 * qui n'est pas connecte.
 */
export const authGuard: CanActivateFn = (_route, etat) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estConnecte()) {
    return true;
  }

  return router.createUrlTree(['/connexion'], {
    queryParams: { retour: etat.url },
  });
};
