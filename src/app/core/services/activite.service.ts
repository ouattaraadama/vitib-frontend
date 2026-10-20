import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

/**
 * Signal d'activite periodique — l'equivalent du « heartbeat » de la
 * plateforme PHP.
 *
 * Deux effets :
 * <ul>
 *   <li>le compte apparait « en ligne » tant qu'il navigue ;</li>
 *   <li>si le compte est bloque pendant la session, l'API repond 401 et la
 *       personne est ramenee a la page de connexion en moins de deux minutes.</li>
 * </ul>
 * Le minuteur demarre et s'arrete tout seul selon l'etat de connexion.
 */
@Injectable({ providedIn: 'root' })
export class ActiviteService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  private minuteur: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.auth.estConnecte()) {
        this.demarrer();
      } else {
        this.arreter();
      }
    });

    inject(DestroyRef).onDestroy(() => this.arreter());
  }

  private demarrer(): void {
    if (this.minuteur !== null) {
      return;
    }
    this.minuteur = setInterval(() => this.signaler(), environment.intervalleActiviteMs);
  }

  private arreter(): void {
    if (this.minuteur !== null) {
      clearInterval(this.minuteur);
      this.minuteur = null;
    }
  }

  private signaler(): void {
    this.auth.signalerActivite().subscribe({
      next: () => undefined,
      error: (erreur: { status?: number }) => {
        // Compte bloque ou session expiree : retour a la connexion.
        if (erreur?.status === 401 || erreur?.status === 403) {
          this.arreter();
          this.auth.oublier();
          this.notifications.avertissement(
            'Votre session a pris fin. Veuillez vous reconnecter.',
          );
          void this.router.navigate(['/connexion']);
        }
      },
    });
  }
}
