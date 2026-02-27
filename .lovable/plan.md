
# Plan: Corrections et Optimisations LiveFoot

## 1. Corriger la barre de recherche

**Probleme** : La recherche du Header et de la page Search utilisent des donnees mock (`useSearch` hook) au lieu des donnees API reelles. Les resultats ne correspondent pas aux vrais matchs/equipes/joueurs affiches sur le site.

**Solution** :
- Modifier `useSearch` pour combiner les donnees mock avec les resultats de l'Explorer (API) quand disponibles
- Corriger le comportement du dropdown de recherche dans le Header : s'assurer que les resultats s'affichent correctement sur mobile et desktop
- Ajouter un lien vers la page `/search` depuis la recherche rapide du header quand aucun resultat n'est trouve

## 2. Supprimer toute mention "Lovable" et "API" visible

**Probleme** : Apres verification, aucun texte "Lovable" ou "API" n'est visible directement dans l'interface utilisateur. Cependant, les pages statiques (About, Contact, Privacy, Terms, NotFound) sont en anglais au lieu du francais, ce qui cree une incoherence.

**Solution** :
- Traduire toutes les pages statiques en francais (About, Contact, Privacy, Terms, NotFound)
- Verifier et supprimer toute reference technique qui pourrait apparaitre dans les messages d'erreur visibles par l'utilisateur

## 3. Verifier et implementer le logo personnalise

**Probleme** : Le hook `useAppLogo` charge le logo depuis le storage backend (`logos/logo.png`), avec fallback sur le logo par defaut. Le logo est utilise dans le Header et le favicon est mis a jour dynamiquement.

**Solution** :
- Le systeme est deja en place. Verifier que le logo par defaut (`src/assets/livefoot-logo.png`) est bien affiche partout : Header, Footer (Index.tsx), page About, page Install
- Remplacer les imports statiques de `livefootLogo` par `useAppLogo()` dans les pages qui utilisent encore l'import direct (Index.tsx footer, About.tsx, Install.tsx)

## 4. Ajouter un popup de consentement aux cookies (RGPD)

**Solution** :
- Creer un composant `CookieConsent` avec :
  - Bandeau en bas de page (au-dessus du BottomNav sur mobile)
  - 3 options : "Accepter tout", "Refuser", "Personnaliser"
  - Sauvegarde du choix dans `localStorage`
  - Le bandeau ne reapparait plus une fois le choix fait
- Ajouter le composant dans `App.tsx`

## 5. Reduire les couts API

**Probleme** : La page Explorer fait 10 appels teams + 10 appels top scorers au chargement. Les hooks `useTeamsByLeague` et `useTopScorers` sont appeles en boucle dans le composant (violation des regles React hooks).

**Solution** :
- Augmenter les `staleTime` pour les donnees semi-statiques (equipes, joueurs, classements) de 2 min a 15-30 min
- Corriger l'Explorer : remplacer les hooks en boucle par un seul hook personnalise qui gere les requetes de facon conditionnelle
- Reduire le nombre de leagues chargees dans l'Explorer de 10 a 5
- Ajouter une strategie de chargement paresseux : ne charger les equipes/joueurs que quand l'utilisateur clique sur l'onglet correspondant
- Augmenter le `gcTime` (garbage collection) pour eviter de re-fetcher des donnees encore en cache

## 6. Navigation fluide et corrections de bugs

**Solution** :
- Ajouter `scroll-behavior: smooth` au CSS global
- Ajouter un `scrollTo(0, 0)` sur chaque changement de route via un composant `ScrollToTop`
- Corriger le menu mobile qui ne se ferme pas toujours correctement
- S'assurer que le `BottomNav` ne bloque pas le contenu en bas de page sur toutes les pages

---

## Details techniques

### Fichiers a creer
| Fichier | Description |
|---------|-------------|
| `src/components/CookieConsent.tsx` | Bandeau RGPD cookies |
| `src/components/ScrollToTop.tsx` | Reset scroll sur navigation |

### Fichiers a modifier
| Fichier | Modifications |
|---------|--------------|
| `src/hooks/useSearch.ts` | Ameliorer la recherche pour fonctionner avec donnees reelles |
| `src/hooks/useApiFootball.ts` | Augmenter staleTime/gcTime pour reduire appels API |
| `src/pages/Explorer.tsx` | Corriger hooks en boucle, lazy loading par onglet |
| `src/pages/About.tsx` | Traduction francais |
| `src/pages/Contact.tsx` | Traduction francais |
| `src/pages/Privacy.tsx` | Traduction francais |
| `src/pages/Terms.tsx` | Traduction francais |
| `src/pages/NotFound.tsx` | Traduction francais |
| `src/pages/Index.tsx` | Utiliser `useAppLogo` au lieu de l'import statique, traduire textes EN restants |
| `src/pages/Install.tsx` | Utiliser `useAppLogo` |
| `src/App.tsx` | Ajouter CookieConsent + ScrollToTop |
| `src/index.css` | Ajouter scroll-behavior smooth |
