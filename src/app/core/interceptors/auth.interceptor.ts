import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/**
 * Ajoute le jeton d'authentification a chaque appel de l'API.
 *
 * Le formulaire public d'inscription fonctionne sans compte, mais le jeton
 * est tout de meme transmis lorsqu'il existe : l'API rattache alors la
 * presence au compte connecte (« scan connecte »).
 */
export const authInterceptor: HttpInterceptorFn = (requete, suivant) => {
  const jeton = inject(AuthService).jeton();

  if (!jeton) {
    return suivant(requete);
  }

  return suivant(
    requete.clone({
      setHeaders: { Authorization: `Bearer ${jeton}` },
    }),
  );
};
