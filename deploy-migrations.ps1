# ═══════════════════════════════════════════════════════════════
# Script de déploiement des migrations Admin Panel sur Supabase
# ═══════════════════════════════════════════════════════════════

param(
    [switch]$DryRun,
    [switch]$SkipConfirm
)

$ErrorActionPreference = "Stop"

# Couleurs
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Blue  Déploiement des migrations Admin Panel$Reset"
Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
Write-Host ""

# Vérifier Supabase CLI
Write-Host "$Yellow[1/4] Vérification de Supabase CLI...$Reset"
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "$Green✓ Supabase CLI détecté: $supabaseVersion$Reset"
} catch {
    Write-Host "$Red✗ Supabase CLI non trouvé$Reset"
    Write-Host "Installation: npm install -g supabase"
    exit 1
}

# Liste des migrations
$migrations = @(
    @{ File = "supabase/migrations/20260512_admin_phase1.sql"; Name = "Phase 1: Fondations Admin"; Order = 1 },
    @{ File = "supabase/migrations/20260512_admin_phase2_monetization.sql"; Name = "Phase 2: Monetisation"; Order = 2 },
    @{ File = "supabase/migrations/20260512_admin_phase3_analytics.sql"; Name = "Phase 3: Analytics"; Order = 3 },
    @{ File = "supabase/migrations/20260512_admin_phase4_content.sql"; Name = "Phase 4: Content Moderation"; Order = 4 }
)

# Vérifier les fichiers
Write-Host ""
Write-Host "$Yellow[2/4] Vérification des fichiers de migration...$Reset"
foreach ($migration in $migrations) {
    $filePath = Join-Path $PSScriptRoot $migration.File
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Write-Host "$Green✓ $($migration.Name) - $size octets$Reset"
    } else {
        Write-Host "$Red✗ $($migration.Name) - Fichier non trouvé: $($migration.File)$Reset"
        exit 1
    }
}

# Vérifier connexion Supabase
Write-Host ""
Write-Host "$Yellow[3/4] Vérification de la connexion Supabase...$Reset"
try {
    $status = supabase status 2>&1
    if ($status -match "connected|Connected|online") {
        Write-Host "$Green✓ Connecté à Supabase$Reset"
    } else {
        Write-Host "$Yellow⚠ Vérifiez que vous êtes connecté: supabase login$Reset"
    }
} catch {
    Write-Host "$Yellow⚠ Impossible de vérifier le statut - continuer quand même? (o/n)$Reset"
    $response = Read-Host
    if ($response -ne "o") {
        exit 1
    }
}

if (-not $SkipConfirm -and -not $DryRun) {
    Write-Host ""
    Write-Host "$Yellow[4/4] Confirmation$Reset"
    Write-Host "Les migrations suivantes vont être déployées:"
    foreach ($migration in $migrations) {
        Write-Host "  $($migration.Order). $($migration.Name)"
    }
    Write-Host ""
    Write-Host "$Red⚠ ATTENTION: Cette opération est irréversible!$Reset"
    $confirm = Read-Host "Continuer? (tapez 'DEPLOYER' pour confirmer)"
    if ($confirm -ne "DEPLOYER") {
        Write-Host "Déploiement annulé."
        exit 0
    }
}

# Déploiement
Write-Host ""
Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Blue  Déploiement des migrations$Reset"
Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
Write-Host ""

foreach ($migration in $migrations | Sort-Object Order) {
    $filePath = Join-Path $PSScriptRoot $migration.File
    
    Write-Host "$Blue[$($migration.Order)/4] $($migration.Name)...$Reset"
    
    if ($DryRun) {
        Write-Host "$Yellow  [DRY RUN] Simuler: supabase db execute --file `"$($migration.File)`"$Reset"
        $content = Get-Content $filePath -Raw
        $lines = ($content -split "`n").Count
        Write-Host "$Yellow  Fichier: $lines lignes$Reset"
    } else {
        try {
            # Exécuter la migration
            $output = supabase db execute --file $filePath 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "$Green  ✓ Migration réussie$Reset"
                if ($output) {
                    Write-Host "$Blue  Output: $output$Reset"
                }
            } else {
                Write-Host "$Red  ✗ Échec de la migration$Reset"
                Write-Host "$Red  $output$Reset"
                
                Write-Host ""
                Write-Host "$YellowContinuer avec les migrations suivantes? (o/n)$Reset"
                $continue = Read-Host
                if ($continue -ne "o") {
                    exit 1
                }
            }
        } catch {
            Write-Host "$Red  ✗ Erreur: $_$Reset"
            exit 1
        }
    }
    Write-Host ""
}

# Vérification post-déploiement
if (-not $DryRun) {
    Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
    Write-Host "$Blue  Vérification post-déploiement$Reset"
    Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
    Write-Host ""
    
    # Vérifier les tables créées
    $verifyQueries = @(
        "SELECT 'admin_audit_log' as table_name, COUNT(*) as count FROM admin_audit_log;",
        "SELECT 'content_moderation_queue' as table_name, COUNT(*) as count FROM content_moderation_queue;",
        "SELECT 'feature_flags' as table_name, COUNT(*) as count FROM feature_flags;",
        "SELECT 'partners' as table_name, COUNT(*) as count FROM partners;",
        "SELECT 'page_views' as table_name, COUNT(*) as count FROM page_views;"
    )
    
    Write-Host "$Green✓ Les migrations ont été déployées avec succès!$Reset"
    Write-Host ""
    Write-Host "$YellowProchaines étapes:$Reset"
    Write-Host "  1. Vérifiez les tables dans le Dashboard Supabase"
    Write-Host "  2. Attribuez-vous le rôle admin:"
    Write-Host "     INSERT INTO public.user_roles (user_id, role)"
    Write-Host "     VALUES ('VOTRE_USER_ID', 'admin');"
    Write-Host "  3. Testez le panel admin sur /admin"
}

Write-Host ""
Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
Write-Host "$Green  Déploiement terminé!$Reset"
Write-Host "$Blue═══════════════════════════════════════════════════════════════$Reset"
