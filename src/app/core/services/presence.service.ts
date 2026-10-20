import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Notification } from '../models/commun.model';
import { EnregistrementPresence, Participation } from '../models/presence.model';
import { Utilisateur } from '../models/utilisateur.model';

/**
 * Presences : enregistrement PUBLIC par scan du code QR et consultation
 * des participations d'un compte.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly http = inject(HttpClient);

  /**
   * Enregistre une presence depuis le formulaire public.
   * Si un jeton valide est present, l'API rattache la presence au compte
   * connecte (« scan connecte »).
   */
  enregistrer(presence: EnregistrementPresence): Observable<Notification> {
    return this.http.post<Notification>(`${environment.urlApi}/public/presences`, presence);
  }

  /** Participations d'un compte (le sien par defaut). */
  participations(utilisateurId?: number | null): Observable<Participation[]> {
    return this.http.get<Participation[]>(`${environment.urlApi}/participations`, {
      params: this.parametres(utilisateurId),
    });
  }

  /** Identite du compte consulte, pour le titre de la page. */
  titulaire(utilisateurId?: number | null): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${environment.urlApi}/participations/titulaire`, {
      params: this.parametres(utilisateurId),
    });
  }

  private parametres(utilisateurId?: number | null): HttpParams {
    let parametres = new HttpParams();
    if (utilisateurId) {
      parametres = parametres.set('utilisateurId', `${utilisateurId}`);
    }
    return parametres;
  }
}
