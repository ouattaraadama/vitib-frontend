/**
 * Comptes et hierarchie des roles.
 * Les valeurs correspondent exactement a celles renvoyees par l'API.
 */

export type Role = 'superadmin' | 'admin' | 'user';

/** Compte connecte, tel que renvoye par /auth/moi. */
export interface Utilisateur {
  id: number;
  nomComplet: string;
  email: string;
  role: Role;
  roleLibelle: string;
  actif: boolean;
  derniereConnexion: string | null;
  derniereActivite: string | null;
  enLigne: boolean;
  photoProfil: string | null;
}

/** Reponse de /auth/connexion. */
export interface ReponseConnexion {
  jeton: string;
  typeJeton: string;
  expireDansSecondes: number;
  utilisateur: Utilisateur;
}

export interface IdentifiantsConnexion {
  email: string;
  motDePasse: string;
}

/** Ligne de la page de gestion des comptes. */
export interface Compte {
  id: number;
  nomComplet: string;
  email: string;
  role: Role;
  roleLibelle: string;
  actif: boolean;
  enLigne: boolean;
  derniereConnexion: string | null;
  derniereActivite: string | null;
  creeParNom: string | null;
  /** Vrai si le compte connecte peut bloquer ou reactiver celui-ci. */
  modifiable: boolean;
}

export interface CreationCompte {
  nomComplet: string;
  email: string;
  motDePasse: string;
  role: Role;
}

export interface ChangementMotDePasse {
  motDePasseActuel: string;
  nouveauMotDePasse: string;
}

/** Classe Bootstrap associee a chaque role, pour les badges. */
export const CLASSES_ROLE: Record<Role, string> = {
  superadmin: 'text-bg-dark',
  admin: 'text-bg-warning',
  user: 'text-bg-info',
};

export const LIBELLES_ROLE: Record<Role, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrateur',
  user: 'Utilisateur',
};