import { StatutEvenement } from './evenement.model';

/** Mode de rattachement d'une presence a un compte de la plateforme. */
export type LienPresence = 'session' | 'email';

/** Formulaire public d'enregistrement (scan du code QR). */
export interface EnregistrementPresence {
  evenementId: number;
  nomComplet: string;
  email: string | null;
  /** Image PNG encodee en base64 (data:image/png;base64,...). */
  signature: string;
}

/** Ligne de la feuille d'emargement. */
export interface Presence {
  id: number;
  numero: number;
  nomComplet: string;
  email: string | null;
  heureArrivee: string;
  enregistreLe: string;
  /** Nulle lorsque l'image a ete effacee par la retention. */
  signature: string | null;
  signatureEffacee: boolean;
  lienVia: LienPresence | null;
  lienLibelle: string | null;
  compteNom: string | null;
}

/** Ligne de la page « Mes participations ». */
export interface Participation {
  evenementId: number;
  titre: string;
  typeLibelle: string;
  organisateurNom: string;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  heureArrivee: string;
  statut: StatutEvenement;
  statutLibelle: string;
  lienVia: LienPresence | null;
  lienLibelle: string;
}
