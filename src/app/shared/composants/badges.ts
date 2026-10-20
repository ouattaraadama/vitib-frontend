import { Component, computed, input } from '@angular/core';

import { CLASSES_STATUT, StatutEvenement } from '../../core/models/evenement.model';
import { CLASSES_ROLE, LIBELLES_ROLE, Role } from '../../core/models/utilisateur.model';
import { TempsEcoulePipe } from '../pipes/formats-fr.pipe';

/**
 * Badges reutilises dans toutes les listes : statut d'evenement, role d'un
 * compte et presence en ligne. Regrouper ces trois pastilles garantit une
 * lecture identique d'un ecran a l'autre.
 */

const LIBELLES_STATUT: Record<StatutEvenement, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

/** Statut d'un evenement : à venir, en cours, terminé, annulé. */
@Component({
  selector: 'app-badge-statut',
  template: `<span [class]="classe()">{{ texte() }}</span>`,
})
export class BadgeStatut {
  readonly statut = input.required<StatutEvenement>();
  /** Libelle fourni par l'API ; a defaut, celui de la table locale. */
  readonly libelle = input<string>('');

  protected readonly classe = computed(() => `badge ${CLASSES_STATUT[this.statut()]}`);
  protected readonly texte = computed(() => this.libelle() || LIBELLES_STATUT[this.statut()]);
}

/** Role d'un compte : superadmin, administrateur, utilisateur. */
@Component({
  selector: 'app-badge-role',
  template: `<span [class]="classe()">{{ texte() }}</span>`,
})
export class BadgeRole {
  readonly role = input.required<Role>();
  readonly libelle = input<string>('');

  protected readonly classe = computed(() => `badge ${CLASSES_ROLE[this.role()]}`);
  protected readonly texte = computed(() => this.libelle() || LIBELLES_ROLE[this.role()]);
}

/**
 * Statut de presence. Un compte est en ligne lorsqu'une activite a ete
 * detectee dans les cinq dernieres minutes ; la deconnexion le bascule
 * immediatement hors ligne.
 */
@Component({
  selector: 'app-badge-en-ligne',
  imports: [TempsEcoulePipe],
  template: `
    @if (!actif()) {
      <span class="badge text-bg-danger">Bloqué</span>
    } @else if (enLigne()) {
      <span class="badge text-bg-success">En ligne</span>
    } @else {
      <span class="badge text-bg-secondary">Hors ligne</span>
      @if (derniereActivite()) {
        <small class="text-muted ms-1">
          dernière activité {{ derniereActivite() | tempsEcoule }}
        </small>
      }
    }
  `,
})
export class BadgeEnLigne {
  readonly enLigne = input.required<boolean>();
  readonly actif = input<boolean>(true);
  readonly derniereActivite = input<string | null>(null);
}
