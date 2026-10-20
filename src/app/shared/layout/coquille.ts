import { Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificationCompteService } from '../../core/services/notification-compte.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeRole } from '../composants/badges';
import { TempsEcoulePipe } from '../pipes/formats-fr.pipe';

/**
 * Coquille des pages connectees : Sidebar verticale, header superieur, pied
 * de page et emplacement du contenu.
 *
 * Le header integre desormais un panneau deroulant de notifications
 * persistantes (creation d'evenements, salle et creneau reserves), en plus
 * des messages "flash" ephemeres deja geres par NotificationService.
 */
@Component({
  selector: 'app-coquille',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BadgeRole, TempsEcoulePipe],
  templateUrl: './coquille.html',
})
export class Coquille {
  private readonly router = inject(Router);
  private readonly titreDocument = inject(Title);
  private readonly notifications = inject(NotificationService);

  protected readonly auth = inject(AuthService);
  protected readonly notificationsCompte = inject(NotificationCompteService);

  /** Sidebar repliee en icones seules (bureau, >= 992px). */
  protected readonly sidebarReduite = signal(false);

  /** Sidebar affichee en panneau superpose (mobile, < 992px). */
  protected readonly menuMobileOuvert = signal(false);

  /** Panneau deroulant de la cloche de notifications. */
  protected readonly panneauNotificationsOuvert = signal(false);

  /**
   * Titre affiche dans le header, derive du titre de route (deja declare
   * dans app.routes.ts). Aucune nouvelle donnee metier n'est introduite.
   */
  protected readonly titrePage = signal(this.nettoyerTitre(this.titreDocument.getTitle()));

  /** Nombre de notifications "flash" actives (badge historique, inchange). */
  protected readonly nbNotifications = computed(() => this.notifications.notifications().length);

  constructor() {
    this.router.events
      .pipe(filter((evenement) => evenement instanceof NavigationEnd))
      .subscribe(() => this.titrePage.set(this.nettoyerTitre(this.titreDocument.getTitle())));

    // Chargement initial de la cloche des notifications persistantes.
    this.notificationsCompte.rafraichir().subscribe();
  }

  protected basculerPanneauNotifications(): void {
    this.panneauNotificationsOuvert.update((ouvert) => !ouvert);
    if (this.panneauNotificationsOuvert()) {
      this.notificationsCompte.rafraichir().subscribe();
    }
  }

  protected fermerPanneauNotifications(): void {
    this.panneauNotificationsOuvert.set(false);
  }

  protected ouvrirNotification(id: number): void {
    this.notificationsCompte.marquerLue(id).subscribe();
    this.fermerPanneauNotifications();
  }

  protected toutMarquerLues(): void {
    this.notificationsCompte.marquerToutesLues().subscribe();
  }

  /** Bascule le repli (bureau) ou l'ouverture (mobile) selon la largeur d'écran. */
  protected basculerSidebar(): void {
    if (window.innerWidth < 992) {
      this.menuMobileOuvert.update((ouvert) => !ouvert);
    } else {
      this.sidebarReduite.update((reduite) => !reduite);
    }
  }

  protected fermerMenuMobile(): void {
    this.menuMobileOuvert.set(false);
  }

  /** Initiales affichees dans l'avatar rond du header (ex : « AO »), a defaut de photo. */
  protected initiales(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected seDeconnecter(): void {
    this.fermerMenuMobile();
    this.auth.deconnecter().subscribe({
      next: () => this.apresDeconnexion(),
      error: () => this.apresDeconnexion(),
    });
  }

  private apresDeconnexion(): void {
    this.notificationsCompte.reinitialiser();
    this.notifications.info('Vous avez été déconnecté.');
    void this.router.navigate(['/connexion']);
  }

  /** « Tableau de bord — VITIB Présences » -> « Tableau de bord » */
  private nettoyerTitre(titre: string): string {
    return titre.split(' — ')[0] || 'Tableau de bord';
  }
}