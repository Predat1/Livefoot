

# Generation d'un logo LiveFoot avec l'IA

## Objectif
Creer un logo professionnel et memorable pour LiveFoot en utilisant l'IA de generation d'images (Gemini), puis l'integrer automatiquement dans l'application.

## Approche

### 1. Edge Function de generation de logo
Creer une edge function `generate-logo` qui utilise le modele `google/gemini-3-pro-image-preview` (meilleure qualite) pour generer un logo de football moderne.

**Prompt de generation** : Logo minimaliste et moderne pour "LiveFoot", application de scores de football en direct. Fond transparent, couleurs vert vif (#22c55e) et blanc, style iconique avec un ballon de football stylise ou un eclair representant le "live". Design vectoriel propre, adapte aux petites tailles (favicon/icone PWA).

### 2. Page d'administration du logo
Ajouter un petit composant sur la page Profile (ou une page dediee) permettant de :
- Generer un logo avec un prompt personnalisable
- Previsualiser le resultat
- Telecharger le logo genere dans le storage backend
- L'appliquer comme logo de l'app

### 3. Integration dans l'app
- Stocker l'image generee dans un bucket storage "logos"
- Mettre a jour les references au logo (Header, Layout footer, favicon)

## Fichiers concernes

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/generate-logo/index.ts` | Nouvelle edge function appelant Gemini image generation |
| `src/pages/Profile.tsx` | Section "Generer un logo" avec bouton, prompt et previsualisation |
| `src/components/Header.tsx` | Utiliser le logo genere depuis le storage si disponible |
| `src/components/Layout.tsx` | Idem pour le footer |

## Details techniques

### Edge function
- Modele : `google/gemini-3-pro-image-preview`
- Utilise `LOVABLE_API_KEY` (deja configure)
- Retourne l'image en base64
- L'image est ensuite uploadee dans un bucket storage `logos`

### Stockage
- Creer un bucket `logos` public
- Stocker le logo genere avec un nom fixe (`logo.png`)
- L'URL publique du bucket sera utilisee dans Header et Layout comme source du logo

### UX
- Bouton "Generer un logo IA" sur la page Profil
- Champ de prompt pre-rempli mais modifiable
- Spinner pendant la generation
- Previsualisation avant application
- Bouton "Appliquer comme logo"

