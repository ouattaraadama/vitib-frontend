import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Politique de confidentialité — page publique référencée depuis le
 * formulaire d'inscription et le pied de page.
 *
 * Elle décrit les données collectées, leurs finalités, leurs destinataires,
 * leur durée de conservation et les droits des personnes, en référence à la
 * loi ivoirienne n° 2013-450 du 19 juin 2013.
 */
@Component({
  selector: 'app-politique-confidentialite',
  template: `
    <main class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-9 col-xl-8">
          <div class="d-flex justify-content-between align-items-center mb-3 sans-impression">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="retour()">
              ← Retour
            </button>
          </div>

          <div class="card shadow-sm">
            <div class="card-header bg-vitib text-white py-3 text-center">
              <img
                src="assets/images/logo_vitib.png"
                alt="Logo VITIB"
                height="48"
                class="bg-white rounded p-1 mb-2"
              />
              <h1 class="h5 mb-0">Politique de confidentialité</h1>
            </div>

            <div class="card-body p-4">
              <p class="text-muted">
                VITIB Présences est la plateforme interne du Village de l'Innovation des
                Technologies de l'Information et de la Biotechnologie. Elle sert à gérer les
                évènements du Village et à enregistrer les présences des participants.
              </p>

              <h2 class="h6 text-vitib mt-4">1. Données collectées</h2>
              <ul>
                <li><strong>Nom complet</strong> — obligatoire, pour établir la feuille d'émargement.</li>
                <li>
                  <strong>Adresse email</strong> — facultative, uniquement pour recevoir le compte
                  rendu de l'évènement.
                </li>
                <li>
                  <strong>Signature numérique</strong> — obligatoire, elle vaut émargement de la
                  feuille de présence.
                </li>
                <li>
                  <strong>Heure d'arrivée</strong> — enregistrée automatiquement au moment de
                  l'inscription.
                </li>
              </ul>

              <h2 class="h6 text-vitib mt-4">2. Finalités</h2>
              <p>
                Ces informations sont utilisées exclusivement dans le cadre formel de la gestion
                des présences aux évènements du VITIB : constitution de la liste d'émargement,
                suivi de la participation et envoi des comptes rendus.
              </p>

              <h2 class="h6 text-vitib mt-4">3. Destinataires</h2>
              <p>
                Seuls les personnels habilités du VITIB — organisateur de l'évènement,
                administrateurs et direction — accèdent à ces informations, dans la limite de leur
                périmètre de responsabilité.
                <strong>Aucune donnée n'est transmise à des tiers</strong>, ni utilisée à des fins
                commerciales.
              </p>

              <h2 class="h6 text-vitib mt-4">4. Durée de conservation</h2>
              <p>Le nettoyage est automatique :</p>
              <ul>
                <li>
                  <strong>3 mois</strong> après un évènement, les images de signature sont
                  effacées. L'historique reste complet : évènement, participants, horaires,
                  comptes rendus et statistiques.
                </li>
                <li>
                  <strong>12 mois</strong> après un évènement, celui-ci est supprimé
                  définitivement, avec ses présences et son compte rendu.
                </li>
                <li>
                  <strong>12 mois</strong> après une connexion, l'entrée correspondante du journal
                  des connexions est supprimée.
                </li>
              </ul>

              <h2 class="h6 text-vitib mt-4">5. Sécurité</h2>
              <p>
                Les échanges sont protégés, les mots de passe stockés sous forme d'empreintes
                irréversibles, et l'accès aux données contrôlé à chaque requête par le serveur.
                Les connexions et les actions sensibles sont horodatées.
              </p>

              <h2 class="h6 text-vitib mt-4">6. Vos droits</h2>
              <p>
                Conformément à la loi ivoirienne <strong>n° 2013-450 du 19 juin 2013</strong>
                relative à la protection des données à caractère personnel, vous disposez d'un
                droit d'accès, de rectification et d'opposition sur les informations vous
                concernant. Pour l'exercer, adressez-vous à l'organisateur de l'évènement ou à
                l'administration du VITIB.
              </p>

              <p class="text-muted small mt-4 mb-0">
                VITIB — Village de l'Innovation des Technologies de l'Information et de la
                Biotechnologie, Grand-Bassam, Côte d'Ivoire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class PolitiqueConfidentialite {
  private readonly location = inject(Location);

  protected retour(): void {
    this.location.back();
  }
}
