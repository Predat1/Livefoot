

# Ajout des fonctionnalites manquantes sur la page detail match

## Contexte
La page Match (`src/pages/Match.tsx`) dispose deja de : events, stats, compos/terrain tactique, notes joueurs, forme recente, predictions API, H2H, pronostics communautaires, cotes et blessures. Il manque 4 elements cles des concurrents.

---

## Fonctionnalites a implementer

### 1. Commentaires textuels live (minute par minute)

L'API-Football propose l'endpoint `fixtures/events` que tu utilises deja. On va transformer ces evenements en un "fil de commentaires" enrichi, avec une timeline chronologique inversee, des icones contextuelles et des descriptions textuelles generees automatiquement a partir des donnees d'evenements.

**Approche** : Creer un nouvel onglet "Commentaires" qui transforme les events en texte narratif minute par minute (ex: "45' -- But ! Mbappe ouvre le score pour le PSG, passe decisive de Dembele").

**Fichier** : `src/pages/Match.tsx`
- Ajouter un onglet "Live" dans `tabItems`
- Generer des commentaires textuels a partir des `events` existants avec des phrases descriptives par type (Goal, Card, subst, Var)
- Afficher dans un format timeline verticale avec minute, icone et texte
- Auto-refresh toutes les 60s (deja en place via `refetchInterval`)

### 2. Momentum / Graphique de pression

Utiliser les statistiques du match (`fixtures/statistics`) pour construire un graphique "momentum" avec Recharts.

**Fichier** : `src/pages/Match.tsx`
- Ajouter un onglet "Momentum" (ou l'integrer dans l'onglet Stats)
- Construire un graphique en barres horizontales comparant les metriques cles : possession, tirs, corners, passes, fautes
- Utiliser un `RadarChart` Recharts pour la vue "radar de domination" (comme SofaScore)
- Les donnees viennent de `teamStats` deja charge

### 3. Shotmap (carte des tirs)

L'API-Football fournit les donnees de tirs via `fixtures/players` (shots.total, shots.on). On creera une representation visuelle simplifiee.

**Fichier** : Nouveau composant `src/components/ShotMap.tsx`
- Terrain SVG simplifie (moitie de terrain avec surface de reparation)
- Positionner les tirs des joueurs de facon semi-aleatoire mais coherente (basee sur la position du joueur)
- Couleur : vert pour tir cadre, rouge pour tir non cadre, or pour but
- Les donnees viennent de `playersData` deja charge (statistiques individuelles par joueur)

**Fichier** : `src/pages/Match.tsx`
- Integrer le composant ShotMap dans l'onglet Stats ou un nouvel onglet

### 4. Prochains matchs des 2 equipes

Le hook `useTeamNextFixtures` existe deja.

**Fichier** : `src/pages/Match.tsx`
- Ajouter un onglet "Calendrier" 
- Appeler `useTeamNextFixtures(homeTeamId)` et `useTeamNextFixtures(awayTeamId)`
- Afficher les 3 prochains matchs de chaque equipe cote a cote

---

## Reorganisation des onglets

L'ordre final des onglets sera :
```text
Live | Events | Stats | Compos | Notes | Forme | Calendrier | Predictions | H2H | Pronostics | Cotes | Blessures
```

"Live" (commentaires) sera le premier onglet par defaut quand le match est en cours.

---

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `src/pages/Match.tsx` | 3 nouveaux onglets (Live/commentaires, Momentum radar, Calendrier), integration ShotMap |
| `src/components/ShotMap.tsx` | Nouveau composant : terrain SVG + visualisation des tirs |

## Details techniques

### Commentaires textuels - Generateur de phrases
```text
Goal -> "[min]' -- BUT ! [joueur] marque pour [equipe]. Passe decisive de [assist]."
Card (Yellow) -> "[min]' -- Carton jaune pour [joueur] ([equipe])."
Card (Red) -> "[min]' -- Carton rouge ! [joueur] ([equipe]) est expulse."
subst -> "[min]' -- Remplacement : [joueur entrant] remplace [joueur sortant]."
Var -> "[min]' -- Decision VAR : [detail]."
```

### Radar Chart Momentum
Utilise `recharts` (deja installe) avec `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar` pour comparer les deux equipes sur 6-8 metriques.

### ShotMap
- SVG 400x300, moitie terrain avec surface
- Cercles positionnes par position du joueur (GK/DEF/MID/FWD -> zones Y differentes)
- X legerement randomise pour eviter superposition
- Taille du cercle proportionnelle au nombre de tirs

### Prochains matchs
- Reutilise `useTeamNextFixtures` (next: "3")  
- Affichage grid 2 colonnes (home/away)

