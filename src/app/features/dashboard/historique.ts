import { Component, computed, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  CLASSES_TYPE_EVENEMENT,
  EvenementResume,
  FiltresHistorique,
} from '../../core/models/evenement.model';
import { DonneesHistorique } from '../../core/resolvers/evenement.resolvers';
import { BadgeStatut } from '../../shared/composants/badges';
import { DateFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * Onglet « Historique » : évènements passés ou annulés, avec recherche par
 * année, mois, période, titre ou nom de participant.
 *
 * Les critères vivent dans l'URL : une recherche est partageable et le
 * bouton « précédent » du navigateur fonctionne naturellement.
 */
@Component({
  selector: 'app-historique',
  imports: [ReactiveFormsModule, RouterLink, BadgeStatut, DateFrPipe, HeureFrPipe],
  templateUrl: './historique.html',
})
export class Historique {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly donnees = input.required<DonneesHistorique>();

  protected readonly evenements = computed(() => this.donnees().evenements);
  protected readonly annees = computed(() => this.donnees().annees);
  protected readonly mois = MOIS;

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    annee: [''],
    mois: [''],
    dateDebut: [''],
    dateFin: [''],
    titre: [''],
    participant: [''],
  });

  constructor() {
    // Les champs refletent les criteres presents dans l'URL.
    const parametres = this.route.snapshot.queryParamMap;
    this.formulaire.patchValue({
      annee: parametres.get('annee') ?? '',
      mois: parametres.get('mois') ?? '',
      dateDebut: parametres.get('dateDebut') ?? '',
      dateFin: parametres.get('dateFin') ?? '',
      titre: parametres.get('titre') ?? '',
      participant: parametres.get('participant') ?? '',
    });
  }

  protected rechercher(): void {
    const criteres = this.formulaire.getRawValue() as FiltresHistorique;
    const parametres: Record<string, string> = {};

    for (const [cle, valeur] of Object.entries(criteres)) {
      if (valeur.trim() !== '') {
        parametres[cle] = valeur.trim();
      }
    }

    void this.router.navigate(['/historique'], { queryParams: parametres });
  }

  protected reinitialiser(): void {
    this.formulaire.reset({
      annee: '',
      mois: '',
      dateDebut: '',
      dateFin: '',
      titre: '',
      participant: '',
    });
    void this.router.navigate(['/historique']);
  }

  /** Classe CSS du badge de type (couleur), purement présentationnelle. */
  protected classeType(evenement: EvenementResume): string {
    return `badge badge-type ${CLASSES_TYPE_EVENEMENT[evenement.type]}`;
  }
}
