

# Tri intelligent, ligues favorites et championnats additionnels

## Objectif
Trois fonctionnalites liees :
1. **Tri intelligent** sur la page d'accueil : Live > Favoris utilisateur > Big 5 > reste
2. **Ligues favorites** : epingler des championnats avec une etoile (persistance via favorites existant)
3. **Championnats additionnels** : Saudi Pro League, Liga MX, Brasileirao, MLS dans Explorer + accueil

---

## 1. Ajouter les championnats manquants

**Fichier : `src/hooks/useApiFootball.ts`**
- Ajouter les IDs des nouvelles ligues a `TRENDING_LEAGUE_IDS` :
  - Saudi Pro League : `307`
  - MLS : `253`
  - Liga MX : `262`
  - Brasileirao Serie A : `71`
- Le tableau passera de 10 a 14 entrees
- `useTrendingLeagues` les inclura automatiquement puisqu'il filtre deja par cet array

**Fichier : `src/pages/Explorer.tsx`**
- Etendre `TOP_LEAGUE_IDS` pour prendre les 10 premieres ligues (au lieu de 5) afin d'inclure les nouvelles dans les onglets Equipes et Joueurs

---

## 2. Systeme de ligues favorites

Le systeme de favoris existant (`useFavorites`) supporte deja le type `competitions`. On va l'exploiter.

**Fichier : `src/pages/Explorer.tsx`**
- Ajouter un bouton etoile a cote de chaque competition dans la liste
- Au clic, appeler `toggleFavorite("competitions", leagueId, leagueName)`
- Les ligues favorites seront mises en evidence (etoile remplie, couleur primaire)

**Fichier : `src/components/LeagueSection.tsx`**
- Ajouter un bouton etoile dans le header de chaque ligue sur la page d'accueil
- Utiliser `useFavorites` pour toggle et afficher l'etat

---

## 3. Tri intelligent sur la page d'accueil

**Fichier : `src/hooks/useApiFootball.ts`**
- Modifier `transformFixturesToLeagues` pour accepter un parametre optionnel `favoriteLeagueIds: Set<string>`
- Nouveau tri en 4 niveaux de priorite :
  1. **Ligues avec matchs live** (priorite max)
  2. **Ligues favorites de l'utilisateur** (via `favorites.competitions`)
  3. **Big 5 + UCL/UEL** (les IDs dans `TRENDING_LEAGUE_IDS`)
  4. **Toutes les autres** (tri par nombre de matchs)

**Fichier : `src/pages/Index.tsx`**
- Importer `useFavorites` et recuperer `favorites.competitions`
- Passer les IDs favoris au tri via un `useMemo` qui re-trie `leagues` selon la logique ci-dessus
- Le tri s'appliquera sur `filteredLeagues` avant le rendu

---

## Details techniques

### Priorite de tri (implementation)
```text
Score de priorite par ligue :
  - A un match live         -> +1000
  - Ligue favorite user     -> +500
  - Dans TRENDING_LEAGUE_IDS -> +100
  - Sinon                   -> 0
  - Departage : nombre de matchs (desc)
```

### Fichiers modifies
| Fichier | Changement |
|---------|-----------|
| `src/hooks/useApiFootball.ts` | Ajout 4 IDs de ligues, export BIG5 set |
| `src/pages/Index.tsx` | Import useFavorites, tri intelligent des leagues |
| `src/pages/Explorer.tsx` | TOP_LEAGUE_IDS elargi, bouton etoile sur competitions |
| `src/components/LeagueSection.tsx` | Bouton etoile dans le header de ligue |

### Pas de migration DB necessaire
Le type `competitions` est deja gere par la table `favorites` existante avec `entity_type = "competition"`.

