import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  IdentifiantsConnexion,
  ReponseConnexion,
  Role,
  Utilisateur,
} from '../models/utilisateur.model';

const CLE_JETON = 'vitib.jeton';
const CLE_UTILISATEUR = 'vitib.utilisateur';

/**
 * Etat d'authentification de l'application.
 *
 * Le compte connecte est expose sous forme de SIGNAL : toute l'interface
 * (menu, gardes, boutons) se recalcule automatiquement a la connexion, a la
 * deconnexion et lorsque le compte est bloque pendant la session.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _utilisateur = signal<Utilisateur | null>(lireUtilisateurStocke());

  /** Compte connecte, ou null. */
  readonly utilisateur = this._utilisateur.asReadonly();

  readonly estConnecte = computed(() => this._utilisateur() !== null);

  readonly role = computed<Role | null>(() => this._utilisateur()?.role ?? null);

  /** Acces a la supervision : administrateurs et superadministrateur. */
  readonly estSuperviseur = computed(() => {
    const role = this.role();
    return role === 'admin' || role === 'superadmin';
  });

  readonly estSuperadmin = computed(() => this.role() === 'superadmin');

  /** Jeton courant, lu par l'intercepteur HTTP. */
  jeton(): string | null {
    return lireStockage(CLE_JETON);
  }

  /** Connexion : memorise le jeton et le compte. */
  connecter(identifiants: IdentifiantsConnexion): Observable<ReponseConnexion> {
    return this.http
      .post<ReponseConnexion>(`${environment.urlApi}/auth/connexion`, identifiants)
      .pipe(
        tap((reponse) => {
          ecrireStockage(CLE_JETON, reponse.jeton);
          ecrireStockage(CLE_UTILISATEUR, JSON.stringify(reponse.utilisateur));
          this._utilisateur.set(reponse.utilisateur);
        }),
      );
  }

  /**
   * Deconnexion. L'etat local est vide quoi qu'il arrive : meme si l'appel
   * echoue, la session ne doit pas rester ouverte cote navigateur.
   */
  deconnecter(): Observable<void> {
    return this.http
      .post<void>(`${environment.urlApi}/auth/deconnexion`, {})
      .pipe(tap({ next: () => this.oublier(), error: () => this.oublier() }));
  }

  /** Relit le compte cote serveur (statut, role, activation). */
  rafraichir(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${environment.urlApi}/auth/moi`).pipe(
      tap((utilisateur) => {
        ecrireStockage(CLE_UTILISATEUR, JSON.stringify(utilisateur));
        this._utilisateur.set(utilisateur);
      }),
    );
  }

  /** Signal d'activite periodique (statut en ligne). */
  signalerActivite(): Observable<void> {
    return this.http.post<void>(`${environment.urlApi}/auth/activite`, {});
  }

  /** Efface l'etat local : appele a la deconnexion et sur une reponse 401. */
  oublier(): void {
    supprimerStockage(CLE_JETON);
    supprimerStockage(CLE_UTILISATEUR);
    this._utilisateur.set(null);
  }
}

// ---------------------------------------------------------------------------
// Stockage local — isole pour rester tolerant a un navigateur restrictif.
// ---------------------------------------------------------------------------

function lireStockage(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrireStockage(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* Navigation privee ou stockage desactive : la session reste en memoire. */
  }
}

function supprimerStockage(cle: string): void {
  try {
    localStorage.removeItem(cle);
  } catch {
    /* Rien a faire. */
  }
}

function lireUtilisateurStocke(): Utilisateur | null {
  const brut = lireStockage(CLE_UTILISATEUR);
  if (!brut) {
    return null;
  }
  try {
    return JSON.parse(brut) as Utilisateur;
  } catch {
    return null;
  }
}
