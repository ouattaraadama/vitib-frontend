import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Utilisateur } from '../../core/models/utilisateur.model';
import { AuthService } from '../../core/services/auth.service';
import { CompteService } from '../../core/services/compte.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeEnLigne, BadgeRole } from '../../shared/composants/badges';
import { DateHeureFrPipe, TempsEcoulePipe } from '../../shared/pipes/formats-fr.pipe';

/** Taille maximale de la photo de profil encodée en base64 : 800 Ko. */
const PHOTO_MAX_OCTETS = 800 * 1024;

/** Côté maximal de la photo après redimensionnement local. */
const PHOTO_COTE_MAX = 200;

/**
 * Espace personnel : identité du compte connecté, photo de profil et
 * changement de mot de passe.
 *
 * La photo est redimensionnée et compressée dans le navigateur avant l'envoi.
 */
@Component({
  selector: 'app-profil',
  imports: [
    ReactiveFormsModule,
    BadgeRole,
    BadgeEnLigne,
    DateHeureFrPipe,
    TempsEcoulePipe,
  ],
  templateUrl: './profil.html',
})
export class Profil {
  private readonly comptes = inject(CompteService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly utilisateur = input.required<Utilisateur>();

  private readonly rafraichi = signal<Utilisateur | null>(null);
  protected readonly compte = computed(
    () => this.rafraichi() ?? this.utilisateur(),
  );

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    motDePasseActuel: ['', [Validators.required]],
    nouveauMotDePasse: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
      ],
    ],
    confirmation: ['', [Validators.required]],
  });

  protected readonly envoiEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly photoEnCours = signal(false);
  protected readonly photoErreur = signal<string | null>(null);

  // ---------------------------------------------------------------------
  // Photo de profil
  // ---------------------------------------------------------------------

  protected async choisirPhoto(evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];

    // Permet de sélectionner à nouveau le même fichier.
    champ.value = '';

    if (!fichier) {
      return;
    }

    this.photoErreur.set(null);

    if (!['image/png', 'image/jpeg'].includes(fichier.type)) {
      this.photoErreur.set('Formats acceptés : PNG ou JPEG.');
      return;
    }

    try {
      const photo = await this.redimensionner(fichier);

      if (photo.length > PHOTO_MAX_OCTETS) {
        this.photoErreur.set(
          "L'image est trop volumineuse, même après compression.",
        );
        return;
      }

      this.photoEnCours.set(true);

      this.comptes.changerPhoto(photo).subscribe({
        next: (notification) => {
          this.photoEnCours.set(false);
          this.notifications.afficher(notification);

          this.auth.rafraichir().subscribe({
            next: (compte) => this.rafraichi.set(compte),
          });
        },
        error: () => {
          this.photoEnCours.set(false);
          this.photoErreur.set(
            "Impossible de modifier la photo. Réessayez.",
          );
        },
      });
    } catch {
      this.photoErreur.set(
        "La photo n'a pas pu être lue. Réessayez avec une autre image.",
      );
    }
  }

  protected supprimerPhoto(): void {
    this.photoErreur.set(null);
    this.photoEnCours.set(true);

    this.comptes.supprimerPhoto().subscribe({
      next: (notification) => {
        this.photoEnCours.set(false);
        this.notifications.afficher(notification);

        this.auth.rafraichir().subscribe({
          next: (compte) => this.rafraichi.set(compte),
        });
      },
      error: () => {
        this.photoEnCours.set(false);
        this.photoErreur.set(
          'Impossible de supprimer la photo. Réessayez.',
        );
      },
    });
  }

  protected initiales(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0]?.toUpperCase() ?? '')
      .join('');
  }

  /** Redimensionne et compresse l'image dans le navigateur avant l'envoi. */
  private redimensionner(fichier: File): Promise<string> {
    return new Promise((resoudre, rejeter) => {
      const lecteur = new FileReader();

      lecteur.onerror = () =>
        rejeter(lecteur.error ?? new Error('lecture impossible'));

      lecteur.onload = () => {
        const image = new Image();

        image.onerror = () => rejeter(new Error('image invalide'));

        image.onload = () => {
          const echelle = Math.min(
            1,
            PHOTO_COTE_MAX / Math.max(image.width, image.height),
          );

          const largeur = Math.max(1, Math.round(image.width * echelle));
          const hauteur = Math.max(1, Math.round(image.height * echelle));

          const toile = document.createElement('canvas');
          toile.width = largeur;
          toile.height = hauteur;

          const contexte = toile.getContext('2d');

          if (!contexte) {
            rejeter(new Error('contexte canvas indisponible'));
            return;
          }

          contexte.drawImage(image, 0, 0, largeur, hauteur);

          // JPEG à 80 % pour réduire le poids de l'avatar.
          resoudre(toile.toDataURL('image/jpeg', 0.8));
        };

        image.src = lecteur.result as string;
      };

      lecteur.readAsDataURL(fichier);
    });
  }

  // ---------------------------------------------------------------------
  // Mot de passe
  // ---------------------------------------------------------------------

  protected soumettre(): void {
    this.erreur.set(null);

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      this.erreur.set(
        'Le nouveau mot de passe doit contenir entre 8 et 72 caractères.',
      );
      return;
    }

    const valeurs = this.formulaire.getRawValue();

    if (valeurs.nouveauMotDePasse !== valeurs.confirmation) {
      this.erreur.set(
        'La confirmation ne correspond pas au nouveau mot de passe.',
      );
      return;
    }

    this.envoiEnCours.set(true);

    this.comptes
      .changerMotDePasse({
        motDePasseActuel: valeurs.motDePasseActuel,
        nouveauMotDePasse: valeurs.nouveauMotDePasse,
      })
      .subscribe({
        next: (notification) => {
          this.envoiEnCours.set(false);

          this.formulaire.reset({
            motDePasseActuel: '',
            nouveauMotDePasse: '',
            confirmation: '',
          });

          this.notifications.afficher(notification);

          this.auth.rafraichir().subscribe({
            next: (compte) => this.rafraichi.set(compte),
          });
        },
        error: () => {
          this.envoiEnCours.set(false);
          this.erreur.set(
            'Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel et réessayez.',
          );
        },
      });
  }
}