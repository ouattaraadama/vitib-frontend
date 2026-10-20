import { Injectable, signal } from '@angular/core';

import { NiveauNotification, Notification } from '../models/commun.model';

/** Notification affichee, avec son identifiant d'affichage. */
export interface NotificationAffichee extends Notification {
  id: number;
}

/** Duree d'affichage par defaut, en millisecondes. */
const DUREE_MS = 6000;

/**
 * Messages transitoires de l'interface — l'equivalent des messages « flash »
 * de la plateforme PHP, mais sans rechargement de page.
 *
 * La liste est un SIGNAL : la zone de notifications se met a jour d'elle-meme.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private compteur = 0;

  private readonly _notifications = signal<NotificationAffichee[]>([]);

  readonly notifications = this._notifications.asReadonly();

  /** Affiche une notification renvoyee telle quelle par l'API. */
  afficher(notification: Notification): void {
    this.ajouter(notification.niveau, notification.message);
  }

  succes(message: string): void {
    this.ajouter('success', message);
  }

  info(message: string): void {
    this.ajouter('info', message);
  }

  avertissement(message: string): void {
    this.ajouter('warning', message);
  }

  erreur(message: string): void {
    this.ajouter('danger', message);
  }

  /** Ferme une notification (croix ou expiration automatique). */
  fermer(id: number): void {
    this._notifications.update((liste) => liste.filter((element) => element.id !== id));
  }

  /** Vide la zone, par exemple lors d'un changement de compte. */
  toutEffacer(): void {
    this._notifications.set([]);
  }

  private ajouter(niveau: NiveauNotification, message: string): void {
    const id = ++this.compteur;
    this._notifications.update((liste) => [...liste, { id, niveau, message }]);
    // Les erreurs restent affichees plus longtemps : elles demandent une action.
    const duree = niveau === 'danger' ? DUREE_MS * 1.5 : DUREE_MS;
    setTimeout(() => this.fermer(id), duree);
  }
}
