import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CLASSES_TYPE_EVENEMENT, EvenementResume } from '../../core/models/evenement.model';
import { DonneesVueGlobale } from '../../core/resolvers/evenement.resolvers';
import { EvenementService } from '../../core/services/evenement.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeStatut } from '../../shared/composants/badges';
import { DateFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

/**
 * Onglet « Vue globale » du tableau de bord.
 *
 * Trois blocs : les cartes statistiques cliquables, les évènements en cours
 * (clôturés automatiquement à leur heure de fin) et les prochains évènements.
 */
@Component({
  selector: 'app-vue-globale',
  imports: [RouterLink, BadgeStatut, DateFrPipe, HeureFrPipe],
  templateUrl: './vue-globale.html',
})
export class VueGlobale {
  private readonly evenements = inject(EvenementService);
  private readonly notifications = inject(NotificationService);

  /** Donnees fournies par le resolveur, avant tout affichage. */
  readonly donnees = input.required<DonneesVueGlobale>();

  /** Rechargement local apres une annulation, sans quitter la page. */
  private readonly rechargees = signal<DonneesVueGlobale | null>(null);

  protected readonly vue = computed(() => this.rechargees() ?? this.donnees());
  protected readonly statistiques = computed(() => this.vue().statistiques);
  protected readonly enCours = computed(() => this.vue().enCours);
  protected readonly prochains = computed(() => this.vue().prochains);

  /** Volets depliables des deux cartes statistiques. */
  protected readonly detailMoisOuvert = signal(false);
  protected readonly detailAnneeOuvert = signal(false);

  /** Evènement dont l'annulation est en cours de confirmation. */
  protected readonly aAnnuler = signal<EvenementResume | null>(null);
  protected readonly annulationEnCours = signal(false);

  protected basculerDetailMois(): void {
    this.detailMoisOuvert.update((ouvert) => !ouvert);
  }

  protected basculerDetailAnnee(): void {
    this.detailAnneeOuvert.update((ouvert) => !ouvert);
  }

  protected demanderAnnulation(evenement: EvenementResume): void {
    this.aAnnuler.set(evenement);
  }

  protected fermerAnnulation(): void {
    this.aAnnuler.set(null);
  }

  /** Annulation confirmée : seule l'organisatrice ou l'organisateur y accède. */
  protected confirmerAnnulation(): void {
    const evenement = this.aAnnuler();
    if (!evenement) {
      return;
    }

    this.annulationEnCours.set(true);
    this.evenements.annuler(evenement.id).subscribe({
      next: (notification) => {
        this.annulationEnCours.set(false);
        this.aAnnuler.set(null);
        this.notifications.afficher(notification);
        this.recharger();
      },
      error: () => {
        this.annulationEnCours.set(false);
        this.aAnnuler.set(null);
      },
    });
  }

  /** Classe CSS du badge de type (couleur), purement présentationnelle. */
  protected classeType(evenement: EvenementResume): string {
    return `badge badge-type ${CLASSES_TYPE_EVENEMENT[evenement.type]}`;
  }

  private recharger(): void {
    forkJoin({
      statistiques: this.evenements.statistiques(),
      enCours: this.evenements.enCours(),
      prochains: this.evenements.prochains(),
    }).subscribe((donnees) => this.rechargees.set(donnees));
  }
}
