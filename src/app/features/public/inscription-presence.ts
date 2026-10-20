import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ErreurApi } from '../../core/models/commun.model';
import { EvenementPublic } from '../../core/models/evenement.model';
import { AuthService } from '../../core/services/auth.service';
import { PresenceService } from '../../core/services/presence.service';
import { BadgeStatut } from '../../shared/composants/badges';
import { ZoneSignature } from '../../shared/composants/zone-signature';
import { DateLongueFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

/** Taille maximale de la signature encodée en base64 : 500 Ko. */
const SIGNATURE_MAX_OCTETS = 500 * 1024;

/**
 * Formulaire PUBLIC d'enregistrement d'une présence, atteint par scan du
 * code QR. Aucun compte n'est nécessaire.
 *
 * Trois rattachements possibles à un compte de la plateforme :
 * scan effectué en étant connecté (le formulaire est alors pré-rempli),
 * adresse email correspondant à un compte, ou rattachement rétroactif lors
 * d'une création de compte ultérieure.
 */
@Component({
  selector: 'app-inscription-presence',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BadgeStatut,
    ZoneSignature,
    DateLongueFrPipe,
    HeureFrPipe,
  ],
  templateUrl: './inscription-presence.html',
})
export class InscriptionPresence {
  private readonly presences = inject(PresenceService);
  private readonly auth = inject(AuthService);

  /** Évènement résolu avant l'affichage ; null si le lien est invalide. */
  readonly evenement = input.required<EvenementPublic | null>();

  protected readonly connecte = this.auth.utilisateur;
  protected readonly enregistree = signal(false);
  protected readonly envoiEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly signature = signal('');

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    nomComplet: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(190)]],
  });

  /** Le formulaire n'est proposé que si les inscriptions sont ouvertes. */
  protected readonly formulaireVisible = computed(() => {
    const evenement = this.evenement();
    return evenement !== null && evenement.inscriptionOuverte && !this.enregistree();
  });

  constructor() {
    // Scan effectué depuis une session ouverte : formulaire pré-rempli et
    // présence rattachée au compte connecté.
    const moi = this.auth.utilisateur();
    if (moi) {
      this.formulaire.patchValue({ nomComplet: moi.nomComplet, email: moi.email });
    }
  }

  protected recevoirSignature(donnees: string): void {
    this.signature.set(donnees);
  }

  protected soumettre(): void {
    const evenement = this.evenement();
    if (!evenement) {
      return;
    }
    this.erreur.set(null);

    if (this.formulaire.controls.nomComplet.value.trim() === '') {
      this.erreur.set('Le nom complet est obligatoire.');
      return;
    }
    if (this.formulaire.controls.email.invalid) {
      this.erreur.set("L'adresse email est invalide.");
      return;
    }
    if (this.signature() === '') {
      this.erreur.set('La signature est obligatoire : signez dans le cadre prévu.');
      return;
    }
    if (this.signature().length > SIGNATURE_MAX_OCTETS) {
      this.erreur.set(
        'La signature est trop volumineuse. Effacez et signez à nouveau plus simplement.',
      );
      return;
    }

    const valeurs = this.formulaire.getRawValue();
    this.envoiEnCours.set(true);

    this.presences
      .enregistrer({
        evenementId: evenement.id,
        nomComplet: valeurs.nomComplet.trim(),
        email: valeurs.email.trim() === '' ? null : valeurs.email.trim().toLowerCase(),
        signature: this.signature(),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.enregistree.set(true);
          // Tentative de fermeture de l'onglet, comme la plateforme PHP.
          setTimeout(() => window.close(), 2500);
        },
        error: (reponse: HttpErrorResponse) => {
          this.envoiEnCours.set(false);
          const corps = reponse.error as Partial<ErreurApi> | null;
          this.erreur.set(corps?.message ?? "Votre présence n'a pas pu être enregistrée.");
        },
      });
  }
}
