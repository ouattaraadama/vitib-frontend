/** Types partages par plusieurs modules. */

/** Niveau d'une notification, aligne sur les alertes Bootstrap. */
export type NiveauNotification = 'success' | 'info' | 'warning' | 'danger';

/** Message renvoye par l'API apres une action. */
export interface Notification {
  niveau: NiveauNotification;
  message: string;
}

/** Enveloppe de pagination commune a toutes les listes paginees. */
export interface Page<T> {
  contenu: T[];
  page: number;
  parPage: number;
  total: number;
  nbPages: number;
}

/** Corps JSON des erreurs de l'API. */
export interface ErreurApi {
  statut: number;
  erreur: string;
  message: string;
  chemin: string;
  champs: Record<string, string> | null;
  horodatage: string;
}
