import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { Page } from '../models/commun.model';
import {
  EntreeJournalConnexion,
  EtatEnLigne,
} from '../models/journal.model';
import { Participation } from '../models/presence.model';
import { Compte, Role, Utilisateur } from '../models/utilisateur.model';
import { AuthService } from '../services/auth.service';
import { CompteService } from '../services/compte.service';
import { JournalService } from '../services/journal.service';
import { PresenceService } from '../services/presence.service';

/**
 * Resolveurs des ecrans de supervision, de participations et de profil.
 */

/** Gestion des comptes : liste du perimetre et roles creables. */
export interface DonneesComptes {
  comptes: Compte[];
  rolesCreables: Role[];
}

export const comptesResolver: ResolveFn<DonneesComptes> = () => {
  const comptes = inject(CompteService);
  return forkJoin({
    comptes: comptes.lister(),
    rolesCreables: comptes.rolesCreables(),
  });
};

/** Journal des connexions : entrees filtrees, statuts en ligne et comptes. */
export interface DonneesJournal {
  journal: Page<EntreeJournalConnexion>;
  enLigne: EtatEnLigne[];
}

export const journalResolver: ResolveFn<DonneesJournal> = (route) => {
  const journal = inject(JournalService);
  const parametres = route.queryParams;

  return forkJoin({
    journal: journal.connexions({
      utilisateurId: parametres['utilisateurId'],
      action: parametres['action'],
      dateDebut: parametres['dateDebut'],
      dateFin: parametres['dateFin'],
      page: parametres['page'] ? Number(parametres['page']) : 1,
    }),
    enLigne: journal.enLigne(),
  });
};

/** Participations : titulaire du compte consulte et ses presences. */
export interface DonneesParticipations {
  titulaire: Utilisateur;
  participations: Participation[];
  /** Vrai lorsqu'on consulte le compte d'une autre personne. */
  consultationExterne: boolean;
}

export const participationsResolver: ResolveFn<DonneesParticipations> = (route) => {
  const presences = inject(PresenceService);
  const auth = inject(AuthService);

  const parametre = route.paramMap.get('utilisateurId');
  const utilisateurId = parametre ? Number(parametre) : null;
  const moi = auth.utilisateur();
  const consultationExterne = utilisateurId !== null && utilisateurId !== (moi?.id ?? null);

  return forkJoin({
    titulaire: presences.titulaire(utilisateurId),
    participations: presences.participations(utilisateurId),
    consultationExterne: of(consultationExterne),
  });
};

/** Espace personnel. */
export const profilResolver: ResolveFn<Utilisateur> = () => inject(CompteService).profil();
