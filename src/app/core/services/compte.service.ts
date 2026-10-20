import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Notification } from '../models/commun.model';
import {
  ChangementMotDePasse,
  Compte,
  CreationCompte,
  Role,
  Utilisateur,
} from '../models/utilisateur.model';

/** Supervision des comptes et espace personnel. */
@Injectable({ providedIn: 'root' })
export class CompteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.urlApi}/comptes`;

  /** Comptes du perimetre : tous pour le superadmin, les users pour un admin. */
  lister(): Observable<Compte[]> {
    return this.http.get<Compte[]>(this.base);
  }

  /** Roles que le compte connecte a le droit de creer. */
  rolesCreables(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/roles-creables`);
  }

  creer(compte: CreationCompte): Observable<Compte> {
    return this.http.post<Compte>(this.base, compte);
  }

  bloquer(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/${id}/blocage`, {});
  }

  reactiver(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/${id}/reactivation`, {});
  }

  /** Espace personnel. */
  profil(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${environment.urlApi}/profil`);
  }

  changerMotDePasse(changement: ChangementMotDePasse): Observable<Notification> {
    return this.http.put<Notification>(`${environment.urlApi}/profil/mot-de-passe`, changement);
  }

  /** Ajout ou remplacement de la photo de profil (image encodee en base64). */
  changerPhoto(photo: string): Observable<Notification> {
    return this.http.put<Notification>(`${environment.urlApi}/profil/photo`, { photo });
  }

  /** Suppression de la photo de profil. */
  supprimerPhoto(): Observable<Notification> {
    return this.http.delete<Notification>(`${environment.urlApi}/profil/photo`);
  }
}