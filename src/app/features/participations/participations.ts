import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DonneesParticipations } from '../../core/resolvers/supervision.resolvers';
import { BadgeStatut } from '../../shared/composants/badges';
import { DateFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

/**
 * « Mes participations » — réunions et évènements auxquels un compte a
 * participé, sa présence ayant été enregistrée via le code QR.
 *
 * La même page sert à consulter les participations d'un autre compte : un
 * administrateur pour les utilisateurs, le superadministrateur pour tous.
 * Le périmètre est vérifié par l'API, jamais ici.
 */
@Component({
  selector: 'app-participations',
  imports: [RouterLink, BadgeStatut, DateFrPipe, HeureFrPipe],
  templateUrl: './participations.html',
})
export class Participations {
  readonly donnees = input.required<DonneesParticipations>();

  protected readonly titulaire = computed(() => this.donnees().titulaire);
  protected readonly participations = computed(() => this.donnees().participations);
  protected readonly consultationExterne = computed(() => this.donnees().consultationExterne);

  protected readonly titre = computed(() =>
    this.consultationExterne()
      ? `Participations de ${this.titulaire().nomComplet}`
      : 'Mes participations',
  );
}
