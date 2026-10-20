import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { inviteGuard } from './core/guards/invite.guard';
import { roleGuard } from './core/guards/role.guard';
import {
  codeQrResolver,
  detailEvenementResolver,
  evenementPublicResolver,
  historiqueResolver,
  vueGlobaleResolver,
} from './core/resolvers/evenement.resolvers';
import {
  comptesResolver,
  journalResolver,
  participationsResolver,
  profilResolver,
} from './core/resolvers/supervision.resolvers';

/**
 * Routes de l'application.
 *
 * Chaque ecran est charge a la demande ({@code loadComponent}) et recoit ses
 * donnees d'un resolveur : la page s'affiche complete, jamais vide.
 *
 * Deux zones distinctes :
 * <ul>
 *   <li>les pages PUBLIQUES — inscription par code QR, politique de
 *       confidentialite, connexion — sans barre de navigation ;</li>
 *   <li>les pages CONNECTEES, encapsulees dans la coquille.</li>
 * </ul>
 */
export const routes: Routes = [
  // -------------------------------------------------------------------------
  // Pages publiques
  // -------------------------------------------------------------------------
  {
    path: 'connexion',
    title: 'Connexion — VITIB Présences',
    canActivate: [inviteGuard],
    loadComponent: () => import('./features/auth/connexion').then((m) => m.Connexion),
  },
  {
    path: 'inscription-presence/:id',
    title: 'Inscription présence — VITIB',
    resolve: { evenement: evenementPublicResolver },
    loadComponent: () =>
      import('./features/public/inscription-presence').then((m) => m.InscriptionPresence),
  },
  {
    path: 'politique-confidentialite',
    title: 'Politique de confidentialité — VITIB Présences',
    loadComponent: () =>
      import('./features/public/politique-confidentialite').then(
        (m) => m.PolitiqueConfidentialite,
      ),
  },

  // -------------------------------------------------------------------------
  // Pages connectees
  // -------------------------------------------------------------------------
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/coquille').then((m) => m.Coquille),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },

      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord — VITIB Présences',
        resolve: { donnees: vueGlobaleResolver },
        loadComponent: () =>
          import('./features/dashboard/vue-globale').then((m) => m.VueGlobale),
      },
      {
        path: 'historique',
        title: 'Historique — VITIB Présences',
        // Les criteres de recherche vivent dans l'URL : le resolveur doit
        // etre rejoue a chaque modification des parametres.
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { donnees: historiqueResolver },
        loadComponent: () =>
          import('./features/dashboard/historique').then((m) => m.Historique),
      },
      {
        path: 'evenements/nouveau',
        title: 'Créer un évènement — VITIB Présences',
        loadComponent: () =>
          import('./features/dashboard/creer-evenement').then((m) => m.CreerEvenement),
      },
      {
        path: 'evenements/:id',
        title: 'Détail de l’évènement — VITIB Présences',
        resolve: { donnees: detailEvenementResolver },
        loadComponent: () =>
          import('./features/dashboard/detail-evenement').then((m) => m.DetailEvenement),
      },
      {
        path: 'evenements/:id/qr',
        title: 'Code QR — VITIB Présences',
        resolve: { donnees: codeQrResolver },
        loadComponent: () => import('./features/dashboard/code-qr').then((m) => m.CodeQrPage),
      },

      {
        path: 'mes-participations',
        title: 'Mes participations — VITIB Présences',
        resolve: { donnees: participationsResolver },
        loadComponent: () =>
          import('./features/participations/participations').then((m) => m.Participations),
      },
      {
        path: 'comptes/:utilisateurId/participations',
        title: 'Participations — VITIB Présences',
        canActivate: [roleGuard('admin', 'superadmin')],
        resolve: { donnees: participationsResolver },
        loadComponent: () =>
          import('./features/participations/participations').then((m) => m.Participations),
      },

      {
        path: 'profil',
        title: 'Mon compte — VITIB Présences',
        resolve: { utilisateur: profilResolver },
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },

      {
        path: 'comptes',
        title: 'Gestion des comptes — VITIB Présences',
        canActivate: [roleGuard('admin', 'superadmin')],
        resolve: { donnees: comptesResolver },
        loadComponent: () => import('./features/comptes/comptes').then((m) => m.Comptes),
      },
      {
        path: 'journal',
        title: 'Journal des connexions — VITIB Présences',
        canActivate: [roleGuard('admin', 'superadmin')],
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { donnees: journalResolver },
        loadComponent: () => import('./features/journal/journal').then((m) => m.Journal),
      },
    ],
  },

  // -------------------------------------------------------------------------
  { path: '**', redirectTo: 'tableau-de-bord' },
];
