import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ErreurApi } from '../../core/models/commun.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Page de connexion.
 *
 * Le message d'erreur affiche est celui du serveur : identifiants invalides,
 * compte desactive ou verrou anti force brute (« Trop de tentatives.
 * Reessayez dans N seconde(s) »).
 */
@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule],
  templateUrl: './connexion.html',
})
export class Connexion {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required]],
  });

  protected readonly envoiEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected soumettre(): void {
    this.erreur.set(null);

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      this.erreur.set('Merci de renseigner votre adresse email et votre mot de passe.');
      return;
    }

    this.envoiEnCours.set(true);
    this.auth.connecter(this.formulaire.getRawValue()).subscribe({
      next: (reponse) => {
        this.envoiEnCours.set(false);
        this.notifications.succes(`Bienvenue, ${reponse.utilisateur.nomComplet} !`);
        const retour = this.route.snapshot.queryParamMap.get('retour');
        void this.router.navigateByUrl(retour ?? '/tableau-de-bord');
      },
      error: (reponse: HttpErrorResponse) => {
        this.envoiEnCours.set(false);
        this.erreur.set(messageErreur(reponse));
      },
    });
  }
}

function messageErreur(reponse: HttpErrorResponse): string {
  if (reponse.status === 0) {
    return "Le serveur est injoignable. Vérifiez que l'API est démarrée, puis réessayez.";
  }
  const corps = reponse.error as Partial<ErreurApi> | null;
  return corps?.message ?? 'Email ou mot de passe incorrect.';
}
