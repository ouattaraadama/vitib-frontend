/**
 * Evenements : types, statut derive, periode d'enregistrement et code QR.
 */

export type TypeEvenement =
  | 'reunion'
  | 'visite'
  | 'gala'
  | 'formation'
  | 'seminaire'
  | 'autres';

export type StatutEvenement = 'a_venir' | 'en_cours' | 'termine' | 'annule';

/** Salles de reunion disponibles pour la reservation. */
export type Salle = 'site_a' | 'site_b';

export const SALLES: ReadonlyArray<{ valeur: Salle; libelle: string }> = [
  { valeur: 'site_a', libelle: 'Salle de réunion — Site A' },
  { valeur: 'site_b', libelle: 'Salle de réunion — Site B' },
];

/** Liste ordonnee proposee dans le formulaire de creation. */
export const TYPES_EVENEMENT: ReadonlyArray<{ valeur: TypeEvenement; libelle: string }> = [
  { valeur: 'reunion', libelle: 'Réunion' },
  { valeur: 'visite', libelle: 'Visite' },
  { valeur: 'gala', libelle: 'Gala' },
  { valeur: 'formation', libelle: 'Formation' },
  { valeur: 'seminaire', libelle: 'Séminaire' },
  { valeur: 'autres', libelle: 'Autres' },
];

/** Classe Bootstrap du badge de statut. */
export const CLASSES_STATUT: Record<StatutEvenement, string> = {
  a_venir: 'text-bg-primary',
  en_cours: 'text-bg-success',
  termine: 'text-bg-secondary',
  annule: 'text-bg-danger',
};

/**
 * Classe du badge de TYPE d'evenement (purement visuel, palette VITIB).
 * Ajoutee pour la refonte graphique : n'affecte aucune regle metier, seule
 * la couleur du badge affiche dans les tableaux en depend.
 */
export const CLASSES_TYPE_EVENEMENT: Record<TypeEvenement, string> = {
  reunion: 'badge-type-reunion',
  visite: 'badge-type-visite',
  gala: 'badge-type-gala',
  formation: 'badge-type-formation',
  seminaire: 'badge-type-seminaire',
  autres: 'badge-type-autres',
};

/** Ligne de liste : tableau de bord, historique, prochains evenements. */
export interface EvenementResume {
  id: number;
  titre: string;
  type: TypeEvenement;
  typeLibelle: string;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  statut: StatutEvenement;
  statutLibelle: string;
  organisateurId: number;
  organisateurNom: string;
  nbPresences: number;
  estOrganisateur: boolean;
  salle: Salle | null;
  salleLibelle: string | null;
}

/**
 * Detail complet. Les drapeaux « peut... » sont calcules par le serveur :
 * l'interface ne fait que masquer des boutons, elle ne decide de rien.
 */
export interface EvenementDetail {
  id: number;
  titre: string;
  type: TypeEvenement;
  typePrecision: string | null;
  typeLibelle: string;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  description: string | null;
  statut: StatutEvenement;
  statutLibelle: string;
  organisateurId: number;
  organisateurNom: string;
  organisateurEmail: string;
  nbPresences: number;
  enregistrementOuvreLe: string | null;
  enregistrementFermeLe: string | null;
  inscriptionOuverte: boolean;
  messageEnregistrement: string | null;
  estOrganisateur: boolean;
  peutProgrammerEnregistrement: boolean;
  peutAnnuler: boolean;
  peutRedigerCompteRendu: boolean;
  emailConfigure: boolean;
  nbDestinatairesPotentiels: number;
  creeLe: string;
  salle: Salle | null;
  salleLibelle: string | null;
}

/** Vue publique servie au formulaire d'inscription (scan du code QR). */
export interface EvenementPublic {
  id: number;
  titre: string;
  typeLibelle: string;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  description: string | null;
  statut: StatutEvenement;
  statutLibelle: string;
  inscriptionOuverte: boolean;
  message: string | null;
}

export interface CreationEvenement {
  titre: string;
  type: TypeEvenement;
  typePrecision: string | null;
  salle: Salle | null;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  description: string | null;
  enregistrementOuvreLe: string | null;
  enregistrementFermeLe: string | null;
}

export interface PeriodeEnregistrement {
  enregistrementOuvreLe: string | null;
  enregistrementFermeLe: string | null;
}

/** Code QR genere localement par l'API, au format SVG. */
export interface CodeQr {
  evenementId: number;
  urlInscription: string;
  svg: string;
  reseauLocal: boolean;
}

/** Criteres de recherche de l'historique. */
export interface FiltresHistorique {
  annee: string;
  mois: string;
  dateDebut: string;
  dateFin: string;
  titre: string;
  participant: string;
}

export const FILTRES_HISTORIQUE_VIDES: FiltresHistorique = {
  annee: '',
  mois: '',
  dateDebut: '',
  dateFin: '',
  titre: '',
  participant: '',
};

export interface Comptage {
  cle: number;
  libelle: string;
  nombre: number;
}

export interface Statistiques {
  evenementsCeMois: number;
  evenementsCetteAnnee: number;
  anneeCourante: number;
  parMois: Comptage[];
  parAnnee: Comptage[];
}