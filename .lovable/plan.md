

# Rendre le DatePicker entierement fonctionnel

## Problemes identifies

1. **Les filtres "All", "Televised", "Live Now" ne filtrent rien** : ils changent un etat local `activeFilter` mais cette valeur n'est jamais remontee a la page `Index.tsx` pour filtrer les matchs affiches.

2. **La selection de date ne filtre rien** : `selectedDate` reste interne au composant, sans effet sur les matchs.

3. **Les fleches gauche/droite ne font rien** : aucun `onClick` n'est defini dessus.

4. **Le bouton calendrier ne fait rien** : pas de popover ni d'action.

5. **Les compteurs sont en dur (103, 14, 1)** : ils ne refletent pas les vraies donnees.

6. **Les matchs n'ont pas de propriete `tv`** : impossible de filtrer par "Televised" sans ajouter ce champ aux donnees.

---

## Corrections prevues

### 1. Ajouter `isTv` aux donnees des matchs (`src/data/mockData.ts`)

Ajouter un champ `isTv: boolean` sur certains matchs (les grands matchs type Arsenal-Chelsea, Real Madrid-Barcelona, etc.) pour que le filtre "Televised" ait du sens.

### 2. Refactorer le DatePicker pour communiquer avec Index

Transformer `DatePicker` pour qu'il accepte des callbacks en props :
- `onDateChange(date: Date)` : informe Index de la date selectionnee
- `onFilterChange(filter: string)` : informe Index du filtre actif
- `matchCounts: { all: number, tv: number, live: number }` : compteurs reels calcules par Index

### 3. Rendre les fleches fonctionnelles

Les fleches decaleront la fenetre de 7 jours affichee (avancer ou reculer d'une semaine).

### 4. Ajouter le calendrier popover

Le bouton calendrier ouvrira un vrai `Calendar` (composant Shadcn existant) dans un `Popover` pour choisir n'importe quelle date.

### 5. Filtrer les matchs dans Index.tsx

Ajouter la logique de filtrage dans `Index.tsx` :
- **All** : affiche tous les matchs
- **Televised** : affiche uniquement les matchs avec `isTv: true`
- **Live Now** : affiche uniquement les matchs avec `status: "live"`

Les compteurs seront calcules dynamiquement a partir des donnees reelles.

### 6. Afficher le calendrier aussi sur mobile

Rendre le bouton calendrier visible sur mobile (actuellement masque par `hidden sm:flex`).

---

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `src/data/mockData.ts` | Ajout de `isTv: true` sur ~6 matchs majeurs |
| `src/components/DatePicker.tsx` | Refactoring complet : props callbacks, fleches fonctionnelles, popover calendrier, compteurs dynamiques |
| `src/pages/Index.tsx` | Logique de filtrage des matchs par filtre actif, calcul des compteurs, passage des props au DatePicker |

---

## Details techniques

### DatePicker - nouvelles props
```
interface DatePickerProps {
  onDateChange?: (date: Date) => void;
  onFilterChange?: (filter: string) => void;
  matchCounts?: { all: number; tv: number; live: number };
}
```

### Index.tsx - logique de filtrage
- Calcul des compteurs `all`, `tv`, `live` a partir de `mockLeagues`
- Filtrage des leagues/matchs selon le filtre actif
- Les leagues vides apres filtrage sont masquees

### Calendrier popover
- Utilise les composants `Popover` + `Calendar` deja installes dans le projet
- Ajout de `pointer-events-auto` sur le Calendar pour l'interactivite
- Selection d'une date dans le calendrier met a jour la date selectionnee dans la barre horizontale

