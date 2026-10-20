import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ErreurApi } from '../models/commun.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Traitement homogene des erreurs de l'API.
 *
 * Le message renvoye par le serveur est affiche tel quel : il est deja
 * redige en francais et ne contient aucun detail technique. Une reponse 401
 * met fin a la session et ramene a la page de connexion.
 */
export const erreurInterceptor: HttpInterceptorFn = (requete, suivant) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  return suivant(requete).pipe(
    catchError((reponse: HttpErrorResponse) => {
      const message = messageLisible(reponse);

      if (reponse.status === 401) {
        auth.oublier();
        // La page de connexion affiche elle-meme son propre message.
        if (!requete.url.includes('/auth/connexion')) {
          notifications.avertissement('Votre session a expire. Veuillez vous reconnecter.');
          void router.navigate(['/connexion']);
          return throwError(() => reponse);
        }
      }

      // La page de connexion et les formulaires affichent leur propre erreur.
      if (!requete.url.includes('/auth/connexion')) {
        notifications.erreur(message);
      }

      return throwError(() => reponse);
    }),
  );
};

/** Extrait le message metier de la reponse, avec des replis surs. */
function messageLisible(reponse: HttpErrorResponse): string {
  if (reponse.status === 0) {
    return "Le serveur est injoignable. Verifiez votre connexion, puis reessayez.";
  }
  const corps = reponse.error as Partial<ErreurApi> | string | null;
  if (typeof corps === 'string' && corps.trim() !== '') {
    return corps;
  }
  if (corps && typeof corps === 'object' && typeof corps.message === 'string') {
    return corps.message;
  }
  return "Une erreur est survenue. Reessayez plus tard.";
}
