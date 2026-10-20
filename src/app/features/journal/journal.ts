import { Component, computed, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CLASSES_ACTION, ActionConnexion } from '../../core/models/journal.model';
import { DonneesJournal } from '../../core/resolvers/supervision.resolvers';
import { AuthService } from '../../core/services/auth.service';
import { BadgeEnLigne, BadgeRole } from '../../shared/composants/badges';
import { DateFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

const ACTIONS: ReadonlyArray<{ valeur: ActionConnexion; libelle: string }> = [
  { valeur: 'connexion', libelle: 'Connexions' },
  { valeur: 'deconnexion', libelle: 'Déconnexions' },
  { valeur: 'echec', libelle: 'Échecs' },
  { valeur: 'bloque', libelle: 'Tentatives sur compte bloqué' },
];

/**
 * Journal des connexions et statut en ligne.
 *
 * Périmètres appliqués par l'API : le superadministrateur voit l'ensemble des
 * comptes, l'administrateur uniquement les comptes utilisateurs. Les critères
 * de recherche et la page courante vivent dans l'URL.
 */
@Component({
  selector: 'app-journal',
  imports: [ReactiveFormsModule, BadgeRole, BadgeEnLigne, DateFrPipe, HeureFrPipe],
  templateUrl: './journal.html',
})
export class Journal {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly auth = inject(AuthService);
  protected readonly actions = ACTIONS;

  readonly donnees = input.required<DonneesJournal>();

  protected readonly page = computed(() => this.donnees().journal);
  protected readonly entrees = computed(() => this.page().contenu);
  protected readonly comptes = computed(() => this.donnees().enLigne);

  /** Index de la première entrée affichée, pour le libellé « Entrées X à Y ». */
  protected readonly premiereEntree = computed(() => {
    const page = this.page();
    return page.total === 0 ? 0 : (page.page - 1) * page.parPage + 1;
  });

  protected readonly derniereEntree = computed(() => {
    const page = this.page();
    return (page.page - 1) * page.parPage + page.contenu.length;
  });

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    utilisateurId: [''],
    action: [''],
    dateDebut: [''],
    dateFin: [''],
  });

  constructor() {
    const parametres = this.route.snapshot.queryParamMap;
    this.formulaire.patchValue({
      utilisateurId: parametres.get('utilisateurId') ?? '',
      action: parametres.get('action') ?? '',
      dateDebut: parametres.get('dateDebut') ?? '',
      dateFin: parametres.get('dateFin') ?? '',
    });
  }

  /** Classe Bootstrap du badge d'une entrée. */
  protected classeAction(action: ActionConnexion): string {
    return `badge ${CLASSES_ACTION[action]}`;
  }

  protected filtrer(): void {
    void this.router.navigate(['/journal'], { queryParams: this.parametres(1) });
  }

  protected reinitialiser(): void {
    this.formulaire.reset({ utilisateurId: '', action: '', dateDebut: '', dateFin: '' });
    void this.router.navigate(['/journal']);
  }

  protected allerPage(numero: number): void {
    void this.router.navigate(['/journal'], { queryParams: this.parametres(numero) });
  }

  /** Critères courants, la page comprise, sans les valeurs vides. */
  private parametres(page: number): Record<string, string> {
    const valeurs = this.formulaire.getRawValue();
    const parametres: Record<string, string> = {};

    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur.trim() !== '') {
        parametres[cle] = valeur.trim();
      }
    }
    if (page > 1) {
      parametres['page'] = `${page}`;
    }
    return parametres;
  }
}
