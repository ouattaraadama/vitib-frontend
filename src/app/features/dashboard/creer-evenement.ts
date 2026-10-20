import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ErreurApi } from '../../core/models/commun.model';
import {
  CreationEvenement,
  Salle,
  SALLES,
  TYPES_EVENEMENT,
  TypeEvenement,
} from '../../core/models/evenement.model';
import { EvenementService } from '../../core/services/evenement.service';
import { NotificationService } from '../../core/services/notification.service';
import { HorodatageFormulaire } from '../../shared/pipes/formats-fr.pipe';

/**
 * Création d'un évènement.
 *
 * La période d'enregistrement est facultative : laissée vide, l'inscription
 * est ouverte dès la création et se ferme automatiquement à l'heure de fin.
 * La réservation de salle est également facultative ; l'API refuse la
 * création si la salle choisie est déjà occupée sur le créneau demandé.
 * Après création, la page du code QR s'ouvre directement, prête à imprimer.
 */
@Component({
  selector: 'app-creer-evenement',
  imports: [ReactiveFormsModule],
  templateUrl: './creer-evenement.html',
})
export class CreerEvenement {
  private readonly evenements = inject(EvenementService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly types = TYPES_EVENEMENT;
  protected readonly salles = SALLES;

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    titre: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['reunion' as TypeEvenement, [Validators.required]],
    typePrecision: ['', [Validators.maxLength(150)]],
    salle: [''],
    dateEvenement: ['', [Validators.required]],
    heureDebut: ['', [Validators.required]],
    heureFin: ['', [Validators.required]],
    description: [''],
    enregistrementOuvreLe: [''],
    enregistrementFermeLe: [''],
  });

  /** Le champ de précision n'apparaît que pour le type « Autres ». */
  protected readonly typeChoisi = signal<TypeEvenement>('reunion');
  protected readonly precisionRequise = computed(() => this.typeChoisi() === 'autres');

  protected readonly envoiEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.formulaire.controls.type.valueChanges.subscribe((type) => {
      this.typeChoisi.set(type);
      if (type !== 'autres') {
        this.formulaire.controls.typePrecision.setValue('');
      }
    });
  }

  protected soumettre(): void {
    this.erreur.set(null);

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      this.erreur.set('Merci de compléter les champs obligatoires.');
      return;
    }

    const valeurs = this.formulaire.getRawValue();

    // Contrôles de cohérence côté navigateur ; l'API les rejoue de toute façon.
    if (valeurs.heureFin <= valeurs.heureDebut) {
      this.erreur.set("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    if (this.precisionRequise() && valeurs.typePrecision.trim() === '') {
      this.erreur.set("Merci de préciser le type d'évènement.");
      return;
    }

    const evenement: CreationEvenement = {
      titre: valeurs.titre.trim(),
      type: valeurs.type,
      typePrecision: valeurs.type === 'autres' ? valeurs.typePrecision.trim() : null,
      salle: valeurs.salle === '' ? null : (valeurs.salle as Salle),
      dateEvenement: valeurs.dateEvenement,
      heureDebut: normaliserHeure(valeurs.heureDebut),
      heureFin: normaliserHeure(valeurs.heureFin),
      description: valeurs.description.trim() === '' ? null : valeurs.description.trim(),
      enregistrementOuvreLe: HorodatageFormulaire.versApi(valeurs.enregistrementOuvreLe),
      enregistrementFermeLe: HorodatageFormulaire.versApi(valeurs.enregistrementFermeLe),
    };

    this.envoiEnCours.set(true);
    this.evenements.creer(evenement).subscribe({
      next: (cree) => {
        this.envoiEnCours.set(false);
        this.notifications.succes(
          'Évènement créé. Voici son code QR, à imprimer ou à afficher.',
        );
        void this.router.navigate(['/evenements', cree.id, 'qr']);
      },
      error: (reponse: HttpErrorResponse) => {
        this.envoiEnCours.set(false);
        const corps = reponse.error as Partial<ErreurApi> | null;
        this.erreur.set(corps?.message ?? "L'évènement n'a pas pu être créé.");
      },
    });
  }
}

/** Les champs « time » renvoient « HH:mm » ; l'API attend « HH:mm:ss ». */
function normaliserHeure(valeur: string): string {
  return valeur.length === 5 ? `${valeur}:00` : valeur;
}