# Script de déploiement des Edge Functions Supabase
# Exécuter après avoir installé le CLI Supabase

# 1. Login (ouvre le navigateur)
supabase login

# 2. Lier au projet (remplacez YOUR_PROJECT_REF par votre ref Supabase)
# Trouvez votre ref dans : Settings > General > Reference ID
supabase link --project-ref YOUR_PROJECT_REF

# 3. Déployer toutes les fonctions
supabase functions deploy api-football
supabase functions deploy ai-prediction
supabase functions deploy football-news
supabase functions deploy chariow-webhook
supabase functions deploy ai-chat
supabase functions deploy claim-referral
supabase functions deploy create-checkout
supabase functions deploy evaluate-predictions
supabase functions deploy generate-logo
supabase functions deploy sitemap
supabase functions deploy validate-license

Write-Host "Déploiement terminé !" -ForegroundColor Green
