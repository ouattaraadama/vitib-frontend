/**
 * Environnement de developpement.
 * L'API Spring Boot ecoute par defaut sur le port 8080.
 */
export const environment = {
  production: false,
  urlApi: '/api',
  /** Periode du signal d'activite, en millisecondes (statut en ligne). */
  intervalleActiviteMs: 120_000,
};
