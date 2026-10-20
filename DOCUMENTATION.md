# VITIB Présences — Frontend (Angular)

Interface de la plateforme **VITIB Présences** : gestion des évènements,
enregistrement des présences par **code QR + signature tactile**, comptes
rendus, supervision et hiérarchie à **trois rôles**
(superadmin > admin > utilisateur).

Application **découplée** : elle ne parle au serveur que par l'API REST du
module `/backend` (Spring Boot).

---

## 1. Stack

| Composant | Version |
|---|---|
| Angular CLI | 20.1.3 |
| Node | 22.17.1 |
| npm | 10.9.2 |
| Interface | Bootstrap 5.3 (CSS) |
| Architecture | Composants **standalone**, **signaux**, **resolvers** |

---

## 2. Démarrage rapide

### 2.1 Prérequis

- Node 22.17.1 et npm 10.9.2 (`node -v`, `npm -v`) ;
- l'**API doit tourner** sur `http://localhost:8080` (voir `../backend/README.md`).

### 2.2 Installation et lancement

```bash
npm install
```

```bash
npm start
```

L'interface répond sur `http://localhost:4200`.

### 2.3 Construction pour la production

```bash
npm run build
```

Le résultat est déposé dans `dist/vitib-presences/browser/`, à servir par
n'importe quel serveur web statique (Apache, Nginx, IIS).

> **Réécriture d'URL obligatoire.** L'application utilise le routage HTML5 :
> le serveur doit renvoyer `index.html` pour toute URL inconnue, sans quoi un
> rechargement sur `/evenements/12` produirait une erreur 404.

---

## 3. Configuration

Tout tient dans `src/environments/` :

| Fichier | Usage |
|---|---|
| `environment.ts` | Développement — `urlApi: 'http://localhost:8080/api'` |
| `environment.production.ts` | Production — `urlApi: '/api'` (même origine) |

```ts
export const environment = {
  production: false,
  urlApi: 'http://localhost:8080/api',
  intervalleActiviteMs: 120_000,
};
```

`intervalleActiviteMs` règle la fréquence du signal d'activité (statut en
ligne). La substitution du fichier en production est déclarée dans
`angular.json` (`fileReplacements`).

**Côté API**, deux réglages doivent correspondre :

- `vitib.origines-autorisees` doit contenir l'origine du frontend (CORS) ;
- `vitib.url-publique` doit pointer vers le frontend : c'est **cette adresse
  qui est encodée dans les codes QR**.

---

## 4. Architecture

```
src/app/
├── core/                 Le socle, sans aucune vue
│   ├── guards/           authGuard, roleGuard, inviteGuard
│   ├── interceptors/     Jeton d'authentification, traitement des erreurs
│   ├── models/           Types partagés, alignés sur les DTO de l'API
│   ├── resolvers/        Chargement des données avant affichage
│   └── services/         Appels HTTP et état applicatif (signaux)
├── shared/               Éléments d'interface réutilisables
│   ├── composants/       Badges, notifications, zone de signature
│   ├── layout/           Coquille des pages connectées (barre de navigation)
│   └── pipes/            Formats français (dates, heures, temps écoulé)
└── features/             Un dossier par module fonctionnel
    ├── auth/             Connexion
    ├── dashboard/        Vue globale, historique, création, détail, code QR
    ├── profil/           Espace personnel
    ├── comptes/          Supervision des comptes
    ├── journal/          Journal des connexions et statut en ligne
    ├── participations/   « Mes participations »
    └── public/           Inscription par code QR, confidentialité
```

`shared/` n'est pas imposé par la consigne : il regroupe ce qui est
réutilisé par plusieurs modules sans appartenir au socle technique.

### 4.1 Composants standalone

Aucun `NgModule`. Chaque composant déclare ses propres dépendances :

```ts
@Component({
  selector: 'app-vue-globale',
  imports: [RouterLink, BadgeStatut, DateFrPipe, HeureFrPipe],
  templateUrl: './vue-globale.html',
})
export class VueGlobale { … }
```

Toutes les routes utilisent `loadComponent` : chaque écran est un module
chargé à la demande, ce qui garde le premier affichage léger.

### 4.2 Signaux

L'état applicatif est porté par des **signaux**, jamais par des variables
mutables observées à la main.

```ts
// core/services/auth.service.ts
private readonly _utilisateur = signal<Utilisateur | null>(…);
readonly utilisateur   = this._utilisateur.asReadonly();
readonly estConnecte   = computed(() => this._utilisateur() !== null);
readonly estSuperviseur = computed(() => {
  const role = this.role();
  return role === 'admin' || role === 'superadmin';
});
```

La barre de navigation, les gardes et les boutons se recalculent seuls à la
connexion, à la déconnexion et lorsqu'un compte est bloqué en cours de
session.

Les entrées de composant sont également des signaux (`input.required<T>()`).
Le motif utilisé pour les écrans qui se rechargent après une action :

```ts
readonly donnees = input.required<DonneesVueGlobale>();      // du resolver
private readonly rechargees = signal<DonneesVueGlobale | null>(null);
protected readonly vue = computed(() => this.rechargees() ?? this.donnees());
```

L'écran s'affiche avec les données du resolver, puis se rafraîchit sur place
après une annulation ou un envoi — sans quitter la page.

### 4.3 Resolvers

Chaque écran reçoit ses données **avant** son affichage : pas d'état vide,
pas de scintillement, pas de squelette de chargement.

```ts
export const vueGlobaleResolver: ResolveFn<DonneesVueGlobale> = () => {
  const evenements = inject(EvenementService);
  return forkJoin({
    statistiques: evenements.statistiques(),
    enCours: evenements.enCours(),
    prochains: evenements.prochains(),
  });
};
```

`withComponentInputBinding()` (dans `app.config.ts`) relie la clé du resolver
à l'entrée du composant du même nom. Sur l'historique et le journal,
`runGuardsAndResolvers: 'paramsOrQueryParamsChange'` rejoue le resolver à
chaque modification des critères : **les recherches vivent dans l'URL**, elles
sont donc partageables et le bouton « précédent » du navigateur fonctionne.

### 4.4 Interceptors

| Interceptor | Rôle |
|---|---|
| `authInterceptor` | Ajoute `Authorization: Bearer …` à chaque appel |
| `erreurInterceptor` | Affiche le message métier du serveur, ferme la session sur `401` |

Le jeton est transmis même sur le formulaire public : l'API rattache alors
automatiquement la présence au compte connecté (« scan connecté »).

### 4.5 Guards

`authGuard`, `roleGuard('admin', 'superadmin')` et `inviteGuard` évitent
d'afficher une page inaccessible. **Ce ne sont pas des protections** : la
matrice des droits est appliquée par l'API, qui relit le compte en base à
chaque requête.

---

## 5. Écrans

| Route | Écran | Accès |
|---|---|---|
| `/connexion` | Connexion | Public |
| `/inscription-presence/:id` | Formulaire de présence (scan du code QR) | Public |
| `/politique-confidentialite` | Protection des données | Public |
| `/tableau-de-bord` | Vue globale : statistiques, en cours, à venir | Connecté |
| `/historique` | Évènements passés ou annulés, recherche multi-critères | Connecté |
| `/evenements/nouveau` | Création d'un évènement | Connecté |
| `/evenements/:id` | Détail, période d'enregistrement, compte rendu, émargement | Connecté |
| `/evenements/:id/qr` | Fiche imprimable du code QR | Connecté |
| `/mes-participations` | Participations du compte connecté | Connecté |
| `/comptes/:id/participations` | Participations d'un autre compte | Admin+ |
| `/profil` | Espace personnel, changement de mot de passe | Connecté |
| `/comptes` | Gestion des comptes | Admin+ |
| `/journal` | Journal des connexions et statut en ligne | Admin+ |

---

## 6. Interface

### 6.1 Bootstrap 5

Seule la **feuille de style** de Bootstrap est chargée (`angular.json` →
`styles`). Les comportements interactifs — fenêtres modales, volets
dépliables, menu mobile — sont pilotés par des signaux Angular plutôt que par
le JavaScript de Bootstrap : un seul acteur manipule le DOM, ce qui évite les
conflits classiques entre le framework et la bibliothèque.

### 6.2 Charte VITIB

`src/styles.css` reprend les couleurs du logo :

```css
--vitib-bleu:   #003366;
--vitib-orange: #F7941D;
--vitib-cyan:   #00AEEF;
--vitib-vert:   #4CAF50;
```

`.bg-vitib` (dégradé bleu → orange), `.btn-vitib`, `.text-vitib`,
`.carte-stat` reproduisent l'identité de la plateforme d'origine.

### 6.3 Responsive

Toutes les grilles utilisent les points de rupture Bootstrap. Sur mobile, les
colonnes secondaires des tableaux (type, organisateur, navigateur) sont
masquées via `d-none d-md-table-cell` : les informations essentielles restent
lisibles sans défilement horizontal.

Le **formulaire public est conçu pour le téléphone** — c'est son usage réel :
la zone de signature s'adapte à la largeur de l'écran et à la densité de
pixels, et accepte le doigt comme la souris.

### 6.4 Impression

`@media print` prépare deux documents papier :

- la **feuille d'émargement** (détail d'un évènement) : numéro, nom, email,
  date et signature, avec la mention VITIB en pied de page ;
- la **fiche du code QR** : logo, message d'accueil, type, date, horaires et
  description.

La classe `.sans-impression` masque tout ce qui n'a pas de sens sur papier ;
`.a-imprimer-seulement` fait l'inverse.

---

## 7. Points remarquables

### 7.1 Zone de signature

`shared/composants/zone-signature.ts` porte le canvas de la plateforme PHP :
souris et tactile, mise à l'échelle selon `devicePixelRatio` (signature nette
à l'impression), adaptation à la largeur disponible. Le composant émet
l'image PNG encodée en base64 ; le formulaire refuse au-delà de **500 Ko**,
comme l'API.

### 7.2 Code QR

Le code est **généré par l'API**, au format SVG, et inséré tel quel dans la
page. Aucun service tiers, aucune bibliothèque de génération côté navigateur :
la plateforme fonctionne sur un réseau interne sans accès à Internet.

Quand l'adresse encodée n'est joignable que depuis le réseau local, l'API le
signale (`reseauLocal`) et la fiche affiche un avertissement explicite.

### 7.3 Statut en ligne et comptes bloqués

`ActiviteService` émet un signal d'activité toutes les deux minutes tant
qu'une session est ouverte. Si le compte a été bloqué entre-temps, l'API
répond `401` : la session est fermée et la personne est ramenée à l'écran de
connexion — **en moins de deux minutes**, comme la plateforme d'origine.

### 7.4 Notifications

`NotificationService` remplace les messages « flash » de la version PHP, sans
rechargement de page. Les messages proviennent le plus souvent de l'API, qui
renvoie déjà un niveau (`success`, `info`, `warning`, `danger`) et un texte en
français.

### 7.5 Formats français

`shared/pipes/formats-fr.pipe.ts` fournit `dateFr` (08/07/2026),
`dateLongueFr` (mardi 8 juillet 2026), `heureFr` (13h30), `dateHeureFr` et
`tempsEcoule` (« il y a 5 min »). Les dates ISO sans fuseau sont analysées
explicitement en heure locale, pour éviter tout décalage d'un jour.

---

## 8. Conventions

- **Code et interface intégralement en français**, y compris les noms de
  classes, de méthodes et de routes ;
- un composant par écran, gabarit dans un fichier `.html` séparé dès qu'il
  dépasse quelques lignes ;
- aucun appel HTTP dans un composant : tout passe par un service de `core/` ;
- aucune règle métier dupliquée côté navigateur — les droits affichés
  (`peutAnnuler`, `peutRedigerCompteRendu`…) sont **calculés par le serveur**.

---

## 9. Dépannage

| Symptôme | Cause probable |
|---|---|
| « Le serveur est injoignable » | L'API n'est pas démarrée sur le port 8080 |
| Erreur CORS dans la console | `vitib.origines-autorisees` ne contient pas `http://localhost:4200` |
| Retour à la connexion en boucle | Jeton expiré ou compte bloqué — se reconnecter |
| Code QR non scannable depuis un mobile | `vitib.url-publique` pointe sur une adresse du réseau local |
| 404 au rechargement d'une page | Réécriture d'URL absente sur le serveur web (§ 2.3) |
