import { Role } from './utilisateur.model';

export type ActionConnexion = 'connexion' | 'echec' | 'bloque' | 'deconnexion';

/** Classe Bootstrap du badge de chaque type d'entree. */
export const CLASSES_ACTION: Record<ActionConnexion, string> = {
  connexion: 'text-bg-success',
  deconnexion: 'text-bg-secondary',
  echec: 'text-bg-warning',
  bloque: 'text-bg-danger',
};

export interface EntreeJournalConnexion {
  id: number;
  creeLe: string;
  utilisateurId: number | null;
  utilisateurNom: string | null;
  role: Role | null;
  roleLibelle: string | null;
  emailTente: string;
  action: ActionConnexion;
  actionLibelle: string;
  adresseIp: string;
  navigateur: string | null;
}

export interface EntreeJournalActivite {
  id: number;
  creeLe: string;
  utilisateurNom: string | null;
  action: string;
  typeCible: string | null;
  idCible: number | null;
  details: string | null;
}

/** Pastille « qui est en ligne ». */
export interface EtatEnLigne {
  id: number;
  nomComplet: string;
  role: Role;
  roleLibelle: string;
  actif: boolean;
  enLigne: boolean;
  derniereActivite: string | null;
}

/** Criteres de filtrage du journal des connexions. */
export interface FiltresJournal {
  utilisateurId: string;
  action: string;
  dateDebut: string;
  dateFin: string;
  page: number;
}

export const FILTRES_JOURNAL_VIDES: FiltresJournal = {
  utilisateurId: '',
  action: '',
  dateDebut: '',
  dateFin: '',
  page: 1,
};
