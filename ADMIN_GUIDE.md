# 📋 Guide d'Administration LiveFoot

## 🚀 Déploiement des Migrations

### Méthode 1: SQL Editor (Recommandé)

1. Ouvrez le [Dashboard Supabase](https://app.supabase.io)
2. Allez dans **SQL Editor**
3. Ouvrez le fichier `supabase/migrations/20260512_admin_complete.sql`
4. Copiez tout le contenu
5. Collez dans l'éditeur SQL
6. Cliquez sur **Run**

### Méthode 2: CLI (Avancé)

```powershell
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref VOTRE_PROJECT_REF

# Exécuter le script PowerShell
.\deploy-migrations.ps1
```

---

## 🎯 Navigation du Panel Admin

| URL | Section | Description |
|-----|---------|-------------|
| `/admin` | Dashboard | Vue d'ensemble des stats globales |
| `/admin/users` | Utilisateurs | Gestion avancée (ban, VIP, rôles) |
| `/admin/monetization` | Monétisation | Transactions, partenaires, revenus |
| `/admin/analytics` | Analytics | Audience, tracking, import Plausible |
| `/admin/content` | Contenu | Modération, articles, commentaires |
| `/admin/settings` | Configuration | Feature flags, maintenance |

---

## 👥 Gestion des Utilisateurs

### Bannir un utilisateur

1. Allez dans **Utilisateurs**
2. Cliquez sur l'utilisateur concerné
3. Dans le drawer, onglet **Profil**
4. Cliquez **Bannir** en bas
5. Indiquez un motif

### Attribuer VIP manuellement

1. Ouvrez le drawer utilisateur
2. Allez dans l'onglet **VIP**
3. Choisissez la durée (7, 30, 90 jours ou 1 an)
4. Cliquez **Accorder VIP**

### Gérer les rôles

Rôles disponibles:
- `admin` : Accès complet
- `moderator` : Modération uniquement
- `user` : Utilisateur standard

---

## 💰 Monétisation

### Ajouter un partenaire

1. Allez dans **Monétisation** → onglet **Partenaires**
2. Cliquez **Ajouter**
3. Remplissez:
   - Nom du partenaire
   - Type (affilié, bookmaker, sponsor)
   - Commission (%) ou montant fixe (€)
   - Email de contact
4. Le **code de tracking** est généré automatiquement

### Suivre les revenus

- **Revenus totaux** : Somme de toutes les transactions VIP
- **ARPU** : Revenue moyen par utilisateur payant
- **Par méthode** : Répartition Stripe/PayPal/Crypto/Chariow

---

## 📊 Analytics

### Import Plausible

1. Exportez votre CSV depuis Plausible
2. Dans **Analytics**, cliquez **Import Plausible**
3. Sélectionnez votre fichier CSV
4. Les données historiques s'ajoutent aux stats internes

### Tracking interne

Collecte automatique de:
- Pages vues
- Sessions uniques
- Pays/Device/Browser
- Parcours utilisateur

**Privacy-friendly**: Pas de stockage d'IP, sessions anonymisées.

---

## 🛡️ Modération

### File d'attente de modération

Accès rapide via le badge rouge dans le menu **Contenu**.

Actions disponibles:
- ✅ **Approuver** : Le contenu est validé
- ❌ **Rejeter** : Suppression + log
- ⚠️ **Escalader** : Transférer à un admin senior

### Signalements automatiques

Les utilisateurs peuvent signaler via le bouton 🚩 sur:
- Commentaires
- Profils suspects
- Actualités (fake news)

---

## ⚙️ Feature Flags

### Activer/Désactiver une fonctionnalité

1. **Configuration** → onglet **Feature Flags**
2. Toggle le switch de la fonctionnalité
3. Option: Déploiement progressif (A/B testing)

Flags existants:
- `vip_pricing` : Système de paiement VIP
- `ai_predictions` : Prédictions IA
- `referral_system` : Parrainage 48h
- `live_odds` : Cotes temps réel
- `community_predictions` : Vote communautaire

### Mode Maintenance

1. **Configuration** → onglet **Maintenance**
2. Activez le toggle
3. Personnalisez le message
4. Seuls les admins peuvent accéder au site

---

## 🔍 Audit & Logs

### Voir l'historique des actions

Chaque action admin est loguée:
- Bannissements / Débannissements
- Attributions VIP
- Modérations
- Changements de rôles
- Modifications de flags

Accès: Table `admin_audit_log` (visible aux admins uniquement)

---

## 🚨 Résolution de Problèmes

### Erreur "Accès refusé"

Vérifiez que vous avez le rôle admin:
```sql
-- Dans SQL Editor
SELECT * FROM public.user_roles WHERE user_id = 'VOTRE_USER_ID';
-- Doit retourner 'admin'
```

Si manquant:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('VOTRE_USER_ID', 'admin');
```

### Les stats ne s'affichent pas

1. Vérifiez que les migrations sont appliquées
2. Rafraîchissez la page (F5)
3. Videz le cache React Query (bouton dans le drawer profil)

### Le tracking ne fonctionne pas

1. Vérifiez RLS sur `page_views`
2. Assurez-vous que `log_page_view` RPC est créée
3. CORS configuré pour votre domaine

---

## 📈 KPIs à Surveiller

| KPI | Cible | Où voir |
|-----|-------|---------|
| Utilisateurs actifs 7j | +10%/mois | Dashboard |
| Taux de conversion VIP | 2-5% | Monétisation |
| ARPU | >20€ | Monétisation |
| Temps moyen session | >3min | Analytics |
| Contenu à modérer | 0 | Contenu |
| Temps de chargement | <2s | - |

---

## 🔐 Sécurité

- ✅ RLS activé sur toutes les tables admin
- ✅ RPCs avec `SECURITY DEFINER` uniquement
- ✅ Vérification `is_admin()` sur toutes les fonctions sensibles
- ✅ Audit log de toutes les actions
- ✅ Pas de mot de passe en clair

---

## 🆘 Support

Email: `Mobifranck310@gmail.com`

Pour les bugs critiques:
1. Capture d'écran du problème
2. Console browser (F12 → Console)
3. Network tab (requêtes en erreur)

---

## 📝 Changelog

### 2024-05-12 - Admin Panel v1.0
- ✅ Phase 1: User Management (ban, VIP, rôles)
- ✅ Phase 2: Monétisation (transactions, partenaires)
- ✅ Phase 3: Analytics (tracking + Plausible)
- ✅ Phase 4: Modération & Feature Flags

---

**© 2024 LiveFoot - Panel Admin Documentation**
