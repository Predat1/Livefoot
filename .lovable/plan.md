

# Amélioration de la page Match

## Aperçu
Enrichir la page Match avec 5 améliorations majeures pour atteindre le niveau des apps professionnelles (FlashScore, FotMob).

## Changements prévus

### 1. Onglets H2H, Odds et Lineups pour les matchs programmés
Actuellement, les matchs "scheduled" n'affichent qu'un bloc "Match Information" statique sans onglets. On va remplacer ce bloc par un système d'onglets avec :
- **Info** : stadium, capacité, arbitre (contenu actuel)
- **Lineups** : compositions probables (lineup existante ou par défaut)
- **H2H** : face-à-face (réutilise le composant H2H existant)
- **Odds** : cotes des bookmakers (réutilise le composant Odds existant)

### 2. Forme récente des 2 équipes (5 derniers matchs W/D/L)
Ajout d'un bandeau sous le header du match (visible pour tous les statuts) affichant :
- 5 pastilles colorées par équipe : Vert (V), Gris (N), Rouge (D)
- Position actuelle au classement (ex: "3rd in Premier League")
- Données mock générées de façon déterministe à partir du nom d'équipe

### 3. Contexte classement
Intégré avec la forme récente : affichage de la position au classement sous les pastilles W/D/L de chaque équipe.

### 4. Banc des remplaçants dans l'onglet Lineups
Ajout d'un dictionnaire `teamBench` avec 5-7 remplaçants par équipe connue. Affichage en dessous du XI titulaire avec un séparateur "Substitutes" et un style légèrement différent (opacité réduite).

### 5. Notes des joueurs pour les matchs terminés
Pour les matchs "finished" uniquement, chaque joueur dans l'onglet Lineups reçoit une note sur 10 (générée de façon déterministe). Code couleur :
- 8-10 : vert (excellente performance)
- 6-7.9 : jaune/neutre
- Moins de 6 : rouge/orange

---

## Détails techniques

### Fichier modifié : `src/pages/Match.tsx`

**Nouvelles données mock :**
- `teamBench: Record<string, LineupPlayer[]>` -- 5-7 remplaçants par équipe
- `generateForm(teamName)` -- retourne un tableau de 5 résultats W/D/L déterministes
- `getLeaguePosition(teamName)` -- retourne une position au classement (1-20)
- `generateRating(playerName, matchId)` -- retourne une note 5.0-9.5 déterministe

**Modifications structurelles :**
1. Ajout du bandeau "Forme récente + Classement" entre le header du match et les onglets (pour tous les statuts)
2. Transformation du bloc `else` (scheduled) en `Tabs` avec 4 onglets : Info, Lineups, H2H, Odds
3. Ajout de la section "Substitutes" dans le `TabsContent value="lineups"` existant
4. Ajout d'un badge note à droite de chaque joueur dans Lineups quand `isFinished`

Aucun nouveau fichier ni nouvelle dépendance requis.

