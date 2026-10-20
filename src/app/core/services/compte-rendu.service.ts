import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CompteRendu,
  RedactionCompteRendu,
  ResultatEnvoi,
} from '../models/compte-rendu.model';

/**
 * Comptes rendus.
 *
 * Regle metier portee par l'API : pendant la reunion, le compte rendu est
 * enregistre SANS etre envoye ; apres la reunion, l'enregistrement declenche
 * l'envoi. Un renvoi reste possible a tout moment.
 */
@Injectable({ providedIn: 'root' })
export class CompteRenduService {
  private readonly http = inject(HttpClient);

  /** Compte rendu d'un evenement, ou null s'il n'a pas encore ete redige. */
  parEvenement(evenementId: number): Observable<CompteRendu | null> {
    return this.http.get<CompteRendu | null>(
      `${environment.urlApi}/evenements/${evenementId}/compte-rendu`,
    );
  }

  rediger(evenementId: number, redaction: RedactionCompteRendu): Observable<ResultatEnvoi> {
    return this.http.post<ResultatEnvoi>(
      `${environment.urlApi}/evenements/${evenementId}/compte-rendu`,
      redaction,
    );
  }

  modifier(compteRenduId: number, redaction: RedactionCompteRendu): Observable<ResultatEnvoi> {
    return this.http.put<ResultatEnvoi>(
      `${environment.urlApi}/comptes-rendus/${compteRenduId}`,
      redaction,
    );
  }

  /** Envoi ou renvoi aux participants ayant renseigne un email. */
  envoyer(compteRenduId: number): Observable<ResultatEnvoi> {
    return this.http.post<ResultatEnvoi>(
      `${environment.urlApi}/comptes-rendus/${compteRenduId}/envoi`,
      {},
    );
  }
}
