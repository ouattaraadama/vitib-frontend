import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CompteRendu } from '../../core/models/compte-rendu.model';
import { CLASSES_TYPE_EVENEMENT, EvenementDetail } from '../../core/models/evenement.model';
import { Presence } from '../../core/models/presence.model';
import { DonneesDetailEvenement } from '../../core/resolvers/evenement.resolvers';
import { CompteRenduService } from '../../core/services/compte-rendu.service';
import { EvenementService } from '../../core/services/evenement.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeStatut } from '../../shared/composants/badges';
import {
  DateFrPipe,
  DateLongueFrPipe,
  HeureFrPipe,
  HorodatageFormulaire,
} from '../../shared/pipes/formats-fr.pipe';

/**
 * Détail d'un évènement — point d'entrée unique regroupant le résumé, la
 * période d'enregistrement, le compte rendu et la feuille d'émargement
 * imprimable.
 *
 * Les droits affichés proviennent du serveur (`peutAnnuler`,
 * `peutRedigerCompteRendu`, `peutProgrammerEnregistrement`) : masquer un
 * bouton n'est jamais une protection, l'API revalide chaque action.
 */
@Component({
  selector: 'app-detail-evenement',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BadgeStatut,
    DateFrPipe,
    DateLongueFrPipe,
    HeureFrPipe,
  ],
  templateUrl: './detail-evenement.html',
})
export class DetailEvenement implements OnInit {
  private readonly evenements = inject(EvenementService);
  private readonly comptesRendus = inject(CompteRenduService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Données du resolveur : la page s'affiche complète dès le premier rendu. */
  readonly donnees = input.required<DonneesDetailEvenement>();

  /** Rechargement local après une action, sans quitter la page. */
  private readonly rechargees = signal<DonneesDetailEvenement | null>(null);

  protected readonly vue = computed(() => this.rechargees() ?? this.donnees());
  protected readonly evenement = computed<EvenementDetail>(() => this.vue().evenement);
  protected readonly participants = computed<Presence[]>(() => this.vue().participants);
  protected readonly compteRendu = computed<CompteRendu | null>(() => this.vue().compteRendu);

  /** Classe CSS du badge de type (couleur), purement présentationnelle. */
  protected readonly classeType = computed(
    () => `badge badge-type ${CLASSES_TYPE_EVENEMENT[this.evenement().type]}`,
  );

  /** Périodes d'enregistrement programmables. */
  protected readonly formulairePeriode = this.fb.nonNullable.group({
    enregistrementOuvreLe: [''],
    enregistrementFermeLe: [''],
  });

  /** Rédaction ou modification du compte rendu. */
  protected readonly formulaireCompteRendu = this.fb.nonNullable.group({
    objet: ['', [Validators.required, Validators.maxLength(200)]],
    contenu: ['', [Validators.required]],
  });

  protected readonly modificationOuverte = signal(false);
  protected readonly actionEnCours = signal(false);
  protected readonly confirmationAnnulation = signal(false);

  /**
   * Les champs reflètent l'état courant dès l'ouverture de la page.
   * L'initialisation a lieu ici, et non dans le constructeur : les entrées
   * du composant ne sont renseignées qu'après son instanciation.
   */
  ngOnInit(): void {
    const { evenement, compteRendu } = this.donnees();
    this.formulairePeriode.patchValue({
      enregistrementOuvreLe: HorodatageFormulaire.versChamp(evenement.enregistrementOuvreLe),
      enregistrementFermeLe: HorodatageFormulaire.versChamp(evenement.enregistrementFermeLe),
    });
    this.formulaireCompteRendu.patchValue({
      objet: compteRendu?.objet ?? `Compte rendu — ${evenement.titre}`,
      contenu: compteRendu?.contenu ?? '',
    });
  }

  protected imprimer(): void {
    window.print();
  }

  // -------------------------------------------------------------------------
  // Période d'enregistrement
  // -------------------------------------------------------------------------

  protected programmerPeriode(): void {
    const valeurs = this.formulairePeriode.getRawValue();
    this.envoyerPeriode(
      HorodatageFormulaire.versApi(valeurs.enregistrementOuvreLe),
      HorodatageFormulaire.versApi(valeurs.enregistrementFermeLe),
    );
  }

  /** Retour au comportement par défaut : les deux champs sont vidés. */
  protected reinitialiserPeriode(): void {
    this.formulairePeriode.setValue({ enregistrementOuvreLe: '', enregistrementFermeLe: '' });
    this.envoyerPeriode(null, null);
  }

  private envoyerPeriode(ouvreLe: string | null, fermeLe: string | null): void {
    this.actionEnCours.set(true);
    this.evenements
      .programmerEnregistrement(this.evenement().id, {
        enregistrementOuvreLe: ouvreLe,
        enregistrementFermeLe: fermeLe,
      })
      .subscribe({
        next: (notification) => {
          this.notifications.afficher(notification);
          this.recharger();
        },
        error: () => this.actionEnCours.set(false),
      });
  }

  // -------------------------------------------------------------------------
  // Annulation
  // -------------------------------------------------------------------------

  protected demanderAnnulation(): void {
    this.confirmationAnnulation.set(true);
  }

  protected fermerAnnulation(): void {
    this.confirmationAnnulation.set(false);
  }

  protected confirmerAnnulation(): void {
    this.actionEnCours.set(true);
    this.evenements.annuler(this.evenement().id).subscribe({
      next: (notification) => {
        this.confirmationAnnulation.set(false);
        this.notifications.afficher(notification);
        this.recharger();
      },
      error: () => {
        this.actionEnCours.set(false);
        this.confirmationAnnulation.set(false);
      },
    });
  }

  // -------------------------------------------------------------------------
  // Compte rendu
  // -------------------------------------------------------------------------

  protected basculerModification(): void {
    this.modificationOuverte.update((ouvert) => !ouvert);
  }

  /**
   * Enregistre le compte rendu. Pendant la réunion, l'API l'enregistre sans
   * l'envoyer ; une fois l'évènement terminé, l'enregistrement déclenche
   * directement l'envoi aux participants.
   */
  protected enregistrerCompteRendu(): void {
    if (this.formulaireCompteRendu.invalid) {
      this.formulaireCompteRendu.markAllAsTouched();
      this.notifications.avertissement("L'objet et le contenu sont obligatoires.");
      return;
    }

    const redaction = {
      objet: this.formulaireCompteRendu.controls.objet.value.trim(),
      contenu: this.formulaireCompteRendu.controls.contenu.value.trim(),
    };
    const existant = this.compteRendu();

    this.actionEnCours.set(true);
    const appel = existant
      ? this.comptesRendus.modifier(existant.id, redaction)
      : this.comptesRendus.rediger(this.evenement().id, redaction);

    appel.subscribe({
      next: (resultat) => {
        this.modificationOuverte.set(false);
        this.notifications.afficher(resultat.notification);
        this.recharger();
      },
      error: () => this.actionEnCours.set(false),
    });
  }

  /** Envoi ou renvoi aux participants ayant renseigné un email. */
  protected envoyerCompteRendu(): void {
    const compteRendu = this.compteRendu();
    if (!compteRendu) {
      return;
    }

    this.actionEnCours.set(true);
    this.comptesRendus.envoyer(compteRendu.id).subscribe({
      next: (resultat) => {
        this.notifications.afficher(resultat.notification);
        this.recharger();
      },
      error: () => this.actionEnCours.set(false),
    });
  }

  // -------------------------------------------------------------------------

  private recharger(): void {
    const id = this.evenement().id;
    forkJoin({
      evenement: this.evenements.detail(id),
      participants: this.evenements.participants(id),
      compteRendu: this.comptesRendus.parEvenement(id),
    }).subscribe({
      next: (donnees) => {
        this.rechargees.set(donnees);
        this.actionEnCours.set(false);
        this.formulairePeriode.patchValue({
          enregistrementOuvreLe: HorodatageFormulaire.versChamp(
            donnees.evenement.enregistrementOuvreLe,
          ),
          enregistrementFermeLe: HorodatageFormulaire.versChamp(
            donnees.evenement.enregistrementFermeLe,
          ),
        });
        if (donnees.compteRendu) {
          this.formulaireCompteRendu.patchValue({
            objet: donnees.compteRendu.objet,
            contenu: donnees.compteRendu.contenu,
          });
        }
      },
      error: () => this.actionEnCours.set(false),
    });
  }

  protected retourHistorique(): void {
    void this.router.navigate(['/historique']);
  }
}
