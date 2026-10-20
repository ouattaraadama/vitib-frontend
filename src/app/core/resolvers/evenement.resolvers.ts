import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { CompteRendu } from '../models/compte-rendu.model';
import {
  CodeQr,
  EvenementDetail,
  EvenementPublic,
  EvenementResume,
  Statistiques,
} from '../models/evenement.model';
import { Presence } from '../models/presence.model';
import { CompteRenduService } from '../services/compte-rendu.service';
import { EvenementService } from '../services/evenement.service';

/**
 * Resolveurs des ecrans d'evenements.
 *
 * Les donnees sont chargees AVANT l'affichage : la page apparait complete,
 * sans etat intermediaire vide ni scintillement.
 */

/** Vue globale : cartes statistiques, evenements en cours et a venir. */
export interface DonneesVueGlobale {
  statistiques: Statistiques;
  enCours: EvenementResume[];
  prochains: EvenementResume[];
}

export const vueGlobaleResolver: ResolveFn<DonneesVueGlobale> = () => {
  const evenements = inject(EvenementService);
  return forkJoin({
    statistiques: evenements.statistiques(),
    enCours: evenements.enCours(),
    prochains: evenements.prochains(),
  });
};

/** Historique : resultats filtres et annees proposees dans le filtre. */
export interface DonneesHistorique {
  evenements: EvenementResume[];
  annees: number[];
}

export const historiqueResolver: ResolveFn<DonneesHistorique> = (route) => {
  const evenements = inject(EvenementService);
  const parametres = route.queryParams;

  return forkJoin({
    evenements: evenements.historique({
      annee: parametres['annee'],
      mois: parametres['mois'],
      dateDebut: parametres['dateDebut'],
      dateFin: parametres['dateFin'],
      titre: parametres['titre'],
      participant: parametres['participant'],
    }),
    annees: evenements.annees(),
  });
};

/** Detail d'un evenement : resume, participants et compte rendu. */
export interface DonneesDetailEvenement {
  evenement: EvenementDetail;
  participants: Presence[];
  compteRendu: CompteRendu | null;
}

export const detailEvenementResolver: ResolveFn<DonneesDetailEvenement> = (route) => {
  const evenements = inject(EvenementService);
  const comptesRendus = inject(CompteRenduService);
  const id = Number(route.paramMap.get('id'));

  return forkJoin({
    evenement: evenements.detail(id),
    participants: evenements.participants(id),
    compteRendu: comptesRendus.parEvenement(id),
  });
};

/** Fiche imprimable du code QR. */
export interface DonneesCodeQr {
  evenement: EvenementDetail;
  codeQr: CodeQr;
}

export const codeQrResolver: ResolveFn<DonneesCodeQr> = (route) => {
  const evenements = inject(EvenementService);
  const id = Number(route.paramMap.get('id'));

  return forkJoin({
    evenement: evenements.detail(id),
    codeQr: evenements.codeQr(id),
  });
};

/**
 * Formulaire PUBLIC d'inscription.
 * L'evenement peut etre introuvable : la page l'affiche alors proprement,
 * plutot que d'echouer et de laisser un ecran blanc au participant.
 */
export const evenementPublicResolver: ResolveFn<EvenementPublic | null> = (
  route,
): Observable<EvenementPublic | null> => {
  const evenements = inject(EvenementService);
  const id = Number(route.paramMap.get('id'));

  if (!id || Number.isNaN(id)) {
    return of(null);
  }
  // Un code QR perime ou altere ne doit pas laisser un ecran blanc :
  // la page affiche « Evenement introuvable » de maniere lisible.
  return evenements.evenementPublic(id).pipe(catchError(() => of(null)));
};
