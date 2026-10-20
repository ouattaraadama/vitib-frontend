import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Compte, LIBELLES_ROLE, Role } from '../../core/models/utilisateur.model';
import { DonneesComptes } from '../../core/resolvers/supervision.resolvers';
import { AuthService } from '../../core/services/auth.service';
import { CompteService } from '../../core/services/compte.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeEnLigne, BadgeRole } from '../../shared/composants/badges';
import { TempsEcoulePipe } from '../../shared/pipes/formats-fr.pipe';

/**
 * Gestion des comptes.
 *
 * Le périmètre est appliqué par l'API : le superadministrateur voit tous les
 * comptes, un administrateur uniquement les comptes utilisateurs. Les rôles
 * proposés à la création viennent également du serveur — un administrateur ne
 * peut créer que des comptes « utilisateur », même en forgeant la requête.
 */
@Component({
  selector: 'app-comptes',
  imports: [ReactiveFormsModule, RouterLink, BadgeRole, BadgeEnLigne, TempsEcoulePipe],
  templateUrl: './comptes.html',
})
export class Comptes {
  private readonly service = inject(CompteService);
  private readonly notifications = inject(NotificationService);

  protected readonly auth = inject(AuthService);

  readonly donnees = input.required<DonneesComptes>();

  private readonly rechargees = signal<DonneesComptes | null>(null);

  protected readonly vue = computed(() => this.rechargees() ?? this.donnees());
  protected readonly comptes = computed(() => this.vue().comptes);
  protected readonly rolesCreables = computed(() =>
    this.vue().rolesCreables.map((role) => ({ valeur: role, libelle: LIBELLES_ROLE[role] })),
  );

  protected readonly creationOuverte = signal(false);
  protected readonly aBloquer = signal<Compte | null>(null);
  protected readonly actionEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaire = inject(FormBuilder).nonNullable.group({
    nomComplet: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    motDePasse: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: ['user' as Role, [Validators.required]],
  });

  // -------------------------------------------------------------------------
  // Création
  // -------------------------------------------------------------------------

  protected ouvrirCreation(): void {
    this.erreur.set(null);
    const premierRole = this.vue().rolesCreables[0] ?? 'user';
    this.formulaire.reset({ nomComplet: '', email: '', motDePasse: '', role: premierRole });
    this.creationOuverte.set(true);
  }

  protected fermerCreation(): void {
    this.creationOuverte.set(false);
  }

  protected creer(): void {
    this.erreur.set(null);

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      this.erreur.set(
        'Nom, adresse email valide et mot de passe de 8 caractères minimum sont obligatoires.',
      );
      return;
    }

    this.actionEnCours.set(true);
    this.service.creer(this.formulaire.getRawValue()).subscribe({
      next: (compte) => {
        this.creationOuverte.set(false);
        this.notifications.succes(
          `Le compte de ${compte.nomComplet} (${compte.roleLibelle}) a été créé.`,
        );
        this.recharger();
      },
      error: () => this.actionEnCours.set(false),
    });
  }

  // -------------------------------------------------------------------------
  // Blocage et réactivation — superadministrateur uniquement
  // -------------------------------------------------------------------------

  protected demanderBlocage(compte: Compte): void {
    this.aBloquer.set(compte);
  }

  protected fermerBlocage(): void {
    this.aBloquer.set(null);
  }

  protected confirmerBlocage(): void {
    const compte = this.aBloquer();
    if (!compte) {
      return;
    }

    this.actionEnCours.set(true);
    this.service.bloquer(compte.id).subscribe({
      next: (notification) => {
        this.aBloquer.set(null);
        this.notifications.afficher(notification);
        this.recharger();
      },
      error: () => {
        this.aBloquer.set(null);
        this.actionEnCours.set(false);
      },
    });
  }

  protected reactiver(compte: Compte): void {
    this.actionEnCours.set(true);
    this.service.reactiver(compte.id).subscribe({
      next: (notification) => {
        this.notifications.afficher(notification);
        this.recharger();
      },
      error: () => this.actionEnCours.set(false),
    });
  }

  // -------------------------------------------------------------------------

  private recharger(): void {
    forkJoin({
      comptes: this.service.lister(),
      rolesCreables: this.service.rolesCreables(),
    }).subscribe({
      next: (donnees) => {
        this.rechargees.set(donnees);
        this.actionEnCours.set(false);
      },
      error: () => this.actionEnCours.set(false),
    });
  }
}
