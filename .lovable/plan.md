

# Systeme complet de championnats a la BeSoccer/FlashScore

## Etat actuel
- Le tri intelligent (Live > Favoris > Big 5) est deja en place sur la page d'accueil
- Les ligues favorites fonctionnent (etoile)
- `TRENDING_LEAGUE_IDS` couvre deja les Tiers 1-3 (Big 5, UCL, UEL, Conference, Eredivisie, Primeira Liga, Saudi, MLS, Liga MX, Brasileirao)
- La page Competitions ne montre que les ~34 ligues trending, pas TOUTES les ligues

## Ce qui manque (et ce plan corrige)

### 1. Refonte de la page Competitions (comme les concurrents)

**Fichier : `src/pages/Competitions.tsx`**

La page sera restructuree en 2 sections :

- **Section "Populaires"** en haut : Big 5 + UCL/UEL/Conference League, visuellement separees avec un header dore/primaire, toujours visibles
- **Section "Tous les championnats"** en dessous : TOUTES les ligues actives (pas seulement les trending), groupees par pays, avec recherche et filtre pays
- Chaque ligue aura un bouton etoile pour l'epingler
- Les ligues favorites remonteront dans la section "Populaires" automatiquement

On utilisera `useAvailableLeagues` (qui fetche `leagues?current=true`) pour obtenir TOUTES les ligues, pas seulement les trending.

### 2. Affinage du tri par tiers sur la page d'accueil

**Fichier : `src/pages/Index.tsx`**

Le scoring actuel sera affine pour distinguer les tiers :

```text
Live                    -> +1000
Favoris utilisateur     -> +500
Tier 1 (Big 5)          -> +200
Tier 2 (UCL/UEL/Conf)   -> +150
Tier 3 (regional)       -> +100
Autre                   -> 0
```

**Fichier : `src/hooks/useApiFootball.ts`**
- Exporter des constantes `TIER1_IDS`, `TIER2_IDS`, `TIER3_IDS` pour une utilisation claire

### 3. Ajout des championnats manquants dans les donnees de reference

**Fichier : `src/hooks/useApiFootball.ts`**

Ajout de quelques ligues supplementaires au `TRENDING_LEAGUE_IDS` pour couvrir les championnats populaires manquants :
- Superliga Argentina (128)
- Turkish Super Lig (203)
- Belgian Pro League (144)
- Scottish Premiership (179)
- Championship anglais (40)

Le `useTrendingLeagues` continuera a les prioriser dans la section "Populaires".

### 4. Hook `useAllLeagues` pour la page Competitions complete

**Fichier : `src/hooks/useApiFootball.ts`**

Nouveau hook qui fetche TOUTES les ligues actives (type "league" + "cup") et les organise :
- Retourne un objet `{ popular: League[], byCountry: Record<string, League[]> }`
- `popular` = toutes les ligues dans TRENDING_LEAGUE_IDS + favoris utilisateur
- `byCountry` = toutes les autres, groupees par pays, triees alphabetiquement

---

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useApiFootball.ts` | Ajout TIER1/2/3 constants, IDs supplementaires, hook `useAllLeagues` |
| `src/pages/Index.tsx` | Scoring affine avec tiers distincts |
| `src/pages/Competitions.tsx` | Refonte complete : section Populaires + tous les championnats par pays avec recherche |

## Details techniques

### Structure de la page Competitions refaite

```text
+----------------------------------+
| Rechercher...            [input] |
+----------------------------------+
| [star] Populaires                |
| +------------------------------+ |
| | PL | Liga | Serie A | BuLi   | |
| | Ligue1 | UCL | UEL | Conf   | |
| | + ligues favorites user      | |
| +------------------------------+ |
+----------------------------------+
| Tous les championnats            |
| [Filtre pays chips]             |
+----------------------------------+
| Angleterre                       |
|   Premier League    [star] [>]  |
|   Championship      [star] [>]  |
| Espagne                         |
|   La Liga           [star] [>]  |
| ...                              |
+----------------------------------+
```

### API calls
- `useAllLeagues` : 1 appel API (`leagues?current=true`) -- cache 2h, retourne ~900 ligues
- Pas de changement au nombre d'appels sur la page d'accueil (les fixtures du jour incluent deja toutes les ligues ayant des matchs)

### Pas de migration DB necessaire
Le systeme de favoris existant couvre deja le type `competitions`.

