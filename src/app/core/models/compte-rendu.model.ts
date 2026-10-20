import { Notification } from './commun.model';

/** Compte rendu d'un evenement et ses statistiques d'envoi. */
export interface CompteRendu {
  id: number;
  evenementId: number;
  objet: string;
  contenu: string;
  auteurNom: string;
  creeLe: string;
  nbDestinataires: number;
  nbEnvoyes: number;
  dernierEnvoiLe: string | null;
  dejaEnvoye: boolean;
}

export interface RedactionCompteRendu {
  objet: string;
  contenu: string;
}

/** Reponse d'une redaction, d'une modification ou d'un (re)envoi. */
export interface ResultatEnvoi {
  compteRendu: CompteRendu;
  destinataires: number;
  envoyes: number;
  notification: Notification;
}
