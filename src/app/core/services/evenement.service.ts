import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Notification } from '../models/commun.model';
import {
  CodeQr,
  CreationEvenement,
  EvenementDetail,
  EvenementPublic,
  EvenementResume,
  FiltresHistorique,
  PeriodeEnregistrement,
  Statistiques,
} from '../models/evenement.model';
import { Presence } from '../models/presence.model';

/**
 * Evenements : listes du tableau de bord, detail, code QR, annulation et
 * periode d'enregistrement.
 *
 * Le service ne filtre rien : le perimetre du role est applique par l'API.
 */
@Injectable({ providedIn: 'root' })
export class EvenementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.urlApi}/evenements`;

  enCours(): Observable<EvenementResume[]> {
    return this.http.get<EvenementResume[]>(`${this.base}/en-cours`);
  }

  prochains(): Observable<EvenementResume[]> {
    return this.http.get<EvenementResume[]>(`${this.base}/prochains`);
  }

  statistiques(): Observable<Statistiques> {
    return this.http.get<Statistiques>(`${this.base}/statistiques`);
  }

  annees(): Observable<number[]> {
    return this.http.get<number[]>(`${this.base}/annees`);
  }

  /** Historique : evenements passes ou annules, recherche multi-criteres. */
  historique(filtres: Partial<FiltresHistorique>): Observable<EvenementResume[]> {
    let parametres = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== null && valeur !== undefined && `${valeur}`.trim() !== '') {
        parametres = parametres.set(cle, `${valeur}`.trim());
      }
    }
    return this.http.get<EvenementResume[]>(`${this.base}/historique`, { params: parametres });
  }

  detail(id: number): Observable<EvenementDetail> {
    return this.http.get<EvenementDetail>(`${this.base}/${id}`);
  }

  creer(evenement: CreationEvenement): Observable<EvenementDetail> {
    return this.http.post<EvenementDetail>(this.base, evenement);
  }

  /** Code QR imprimable, genere localement par l'API. */
  codeQr(id: number): Observable<CodeQr> {
    return this.http.get<CodeQr>(`${this.base}/${id}/qr`);
  }

  /** Feuille d'emargement : participants et signatures. */
  participants(id: number): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${this.base}/${id}/participants`);
  }

  annuler(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/${id}/annulation`, {});
  }

  programmerEnregistrement(id: number, periode: PeriodeEnregistrement): Observable<Notification> {
    return this.http.put<Notification>(`${this.base}/${id}/periode-enregistrement`, periode);
  }

  /** Vue PUBLIQUE, servie au formulaire d'inscription (aucun compte requis). */
  evenementPublic(id: number): Observable<EvenementPublic> {
    return this.http.get<EvenementPublic>(`${environment.urlApi}/public/evenements/${id}`);
  }
}
