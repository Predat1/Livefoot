
# Audit complet LiveFoot - Ce qui manque (hors API)

## Constat general

Le site est bien structuré et couvre les bases. Cependant, apres une inspection fichier par fichier, voici tout ce qui manque pour atteindre le niveau BeSoccer / LiveScore, groupe par priorité et impact utilisateur.

---

## Priorité 1 - Critique : Backend non connecté au frontend

### Favoris toujours en localStorage
La table `favorites` existe dans la base de données Cloud, mais `useFavorites.ts` utilise encore uniquement `localStorage`. Un utilisateur connecté perd ses favoris s'il change d'appareil.

**Ce qu'il faut faire :**
- Modifier `useFavorites.ts` pour lire/écrire dans la table `favorites` quand l'utilisateur est connecté
- Fusionner les favoris localStorage avec la base au moment de la connexion
- Sinon le backend ne sert à rien pour cette fonctionnalité

### Pas de page Profil utilisateur (`/profile`)
Le header affiche un menu "My Favorites" mais pas de lien vers un profil. La table `profiles` (avec `display_name`, `username`, `bio`, `avatar_url`, `favorite_team`) existe en base mais aucune page ne permet de la modifier.

**Ce qu'il faut créer :**
- Page `/profile` avec formulaire d'édition : display name, username, bio, équipe favorite
- Lien dans le menu dropdown du header vers `/profile`

---

## Priorité 2 - Haute : UX et navigation

### Pas de notifications push / alertes match
Le header a une icône `Bell` avec un point rouge, mais elle ne fait rien. Aucun système de notification n'est en place (même local).

**Ce qu'il faut ajouter :**
- Page `/notifications` ou panneau slide-over listant les alertes (buts, fin de match) de ses équipes favorites
- Ou au minimum, rendre la cloche cliquable et mener vers les matchs des équipes favorites

### Pas de page "Live" dédiée
Les sites pros (LiveScore, Sofascore) ont une vue filtrée uniquement sur les matchs en cours, accessible en 1 clic depuis le header ou la navigation mobile. Actuellement il existe un filtre "live" sur la page d'accueil mais pas de route dédiée `/live`.

### Navigation mobile insuffisante
Sur mobile, la barre de navigation est uniquement un menu hamburger. Les sites pros ont une **bottom navigation bar** (barre fixe en bas avec 5 onglets : Matches, News, Competitions, Favorites, Profil). C'est le standard mobile pour les apps de score.

### Pas de comparaison de joueurs
La page `/players` permet filtres et tri, mais pas de comparer 2 joueurs côte à côte (fonctionnalité présente sur BeSoccer, Sofascore).

---

## Priorité 3 - Moyenne : Contenu des pages existantes

### Page TeamDetail - onglet "Fixtures" manquant
Le panneau de l'équipe a 4 onglets (Overview, Squad, Results, Stats) mais pas de calendrier des prochains matchs de l'équipe (onglet "Fixtures" présent sur BeSoccer).

### Page Competitions - onglet "Fixtures" manquant
Chaque compétition dépliable montre Standings + Top Scorers, mais pas le calendrier des prochains matchs de la compétition.

### Page Standings - pas de lien cliquable vers les équipes
Le nom d'équipe dans le tableau de classement génère un lien vers `/teams/arsenal` par exemple mais avec `.replace(/ /g, "-").toLowerCase()` hardcodé. Des équipes avec des noms spéciaux (Atlético, Borussia Dortmund) peuvent avoir des IDs qui ne correspondent pas aux IDs dans `teamsData.ts`. Certains liens sont donc cassés.

### Page Match - onglet "Lineups" non interactif
Le terrain tactique (onglet "Field") est là, mais dans l'onglet "Lineups" les joueurs ne sont pas cliquables vers leur fiche `/players/:id`.

### Page Match - pas de lien vers les pages équipes dans le header du match
Les logos des équipes dans l'en-tête du match ne sont pas des liens vers `/teams/:teamId`.

### Page PlayerDetail - pas d'historique de saisons
Sofascore et BeSoccer affichent les stats saison par saison. Actuellement, seule la saison en cours est affichée, sans historique.

### Page Teams - filtres par ligue/pays absents
La page Teams affiche toutes les équipes sans possibilité de filtrer par compétition ou pays.

---

## Priorité 4 - Basse : Qualité et enrichissement

### Pas de partage social
Aucun bouton "Share" sur les pages match, joueur, ou équipe pour partager sur Twitter/WhatsApp.

### Pas de mode hors-ligne / cache
L'application est une PWA (avec `vite-plugin-pwa`) mais aucun service worker n'est configuré pour mettre en cache les données. Si l'utilisateur n'a pas de réseau, la page est blanche.

### Pas de raccourci clavier pour la recherche
Sur les sites pros, appuyer sur `/` ou `Ctrl+K` ouvre la recherche. Ce n'est pas implémenté.

### Pied de page sans réseaux sociaux
Le footer n'a pas de liens vers Twitter/X, Instagram, YouTube comme les sites pros.

---

## Plan d'implémentation proposé

### Phase 1 - Backend réel pour les favoris + Page Profil (impact le plus fort)
1. Refactorer `useFavorites.ts` : quand user connecté → lecture/écriture Lovable Cloud, sinon localStorage
2. Créer `src/pages/Profile.tsx` avec formulaire d'édition du profil (display_name, username, bio, favorite_team)
3. Ajouter la route `/profile` dans `App.tsx`
4. Ajouter lien "My Profile" dans le dropdown du Header

### Phase 2 - Navigation mobile + Bottom Bar
1. Créer `src/components/BottomNav.tsx` : barre fixe en bas avec icônes Matches / News / Favoris / Profil
2. Intégrer dans `Layout.tsx` (visible uniquement sur mobile)
3. Ajouter padding-bottom au contenu sur mobile pour éviter chevauchement

### Phase 3 - Enrichissement des pages existantes
1. TeamDetail : ajouter onglet "Fixtures" avec les prochains matchs
2. Competitions : ajouter onglet "Fixtures"
3. Players : ajouter comparaison côte à côte (sélectionner 2 joueurs, vue comparative)
4. Match : rendre les noms de joueurs dans l'onglet Lineups cliquables
5. Match : rendre les logos d'équipes dans le header cliquables vers les pages équipes
6. Standings : corriger les liens d'équipes (utiliser le vrai teamId depuis teamsData)
7. Teams : ajouter filtre par ligue/pays

### Phase 4 - Fonctionnalités extras
1. Cloche de notification → page ou panneau alertes
2. Boutons Share (Web Share API native)
3. Raccourci clavier `/` ou `Ctrl+K` pour la recherche
4. Liens réseaux sociaux dans le footer

---

## Résumé des fichiers à créer/modifier

**Créer :**
- `src/pages/Profile.tsx`
- `src/components/BottomNav.tsx`

**Modifier :**
- `src/hooks/useFavorites.ts` — connecter au backend Cloud
- `src/components/Layout.tsx` — ajouter BottomNav
- `src/components/Header.tsx` — ajouter lien Profile dans dropdown
- `src/App.tsx` — route /profile
- `src/pages/TeamDetail.tsx` — onglet Fixtures
- `src/pages/Competitions.tsx` — onglet Fixtures
- `src/pages/Players.tsx` — comparaison joueurs
- `src/pages/Match.tsx` — liens joueurs + liens équipes
- `src/pages/Teams.tsx` — filtres par ligue
- `src/pages/Standings.tsx` — corriger liens équipes
