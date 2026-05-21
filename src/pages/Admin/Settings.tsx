import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  useAdminFeatureFlags,
  useSetFeatureFlag,
  useAdminSiteSettings,
  useSetMaintenanceMode,
  usePurgeCache,
  useSetSiteSetting,
  useAdminNewsletterStats,
  useExportNewsletterCsv,
  useAdminApiUsageStats,
  useAdminTriggerBackup,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  Settings,
  ToggleLeft,
  AlertTriangle,
  Globe,
  Mail,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Crown,
  RefreshCw,
  Trash2,
  Newspaper,
  Database,
  Activity,
  Download,
  Archive,
  Clock,
  Gift,
  Bell,
  Send,
} from "lucide-react";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vip_pricing: Crown,
  ai_predictions: Zap,
  referral_system: Users,
  live_odds: RefreshCw,
  community_predictions: Users,
};

export default function AdminSettings() {
  const { data: featureFlags, isLoading: flagsLoading } = useAdminFeatureFlags();
  const { data: siteSettings, isLoading: settingsLoading } = useAdminSiteSettings();
  const setFeatureFlag = useSetFeatureFlag();
  const setMaintenanceMode = useSetMaintenanceMode();
  const purgeCache = usePurgeCache();
  const setSiteSetting = useSetSiteSetting();
  
  // Phase 6 hooks
  const { data: newsletterStats, isLoading: newsletterLoading } = useAdminNewsletterStats();
  const exportNewsletter = useExportNewsletterCsv();
  const { data: apiStats, isLoading: apiLoading } = useAdminApiUsageStats(7);
  const triggerBackup = useAdminTriggerBackup();

  const maintenanceEnabled = siteSettings?.find((s) => s.key === "maintenance_mode")?.value === "true";
  const maintenanceMessage = siteSettings?.find((s) => s.key === "maintenance_message")?.value || "";
  const siteName = siteSettings?.find((s) => s.key === "site_name")?.value || "LiveFoot";
  const supportEmail = siteSettings?.find((s) => s.key === "support_email")?.value || "";

  const [localSettings, setLocalSettings] = useState({
    siteName,
    supportEmail,
    maintenanceMessage,
  });

  // Keep localSettings in sync with siteSettings once loaded
  useEffect(() => {
    if (siteSettings) {
      setLocalSettings({
        siteName: siteSettings.find((s) => s.key === "site_name")?.value || "LiveFoot",
        supportEmail: siteSettings.find((s) => s.key === "support_email")?.value || "",
        maintenanceMessage: siteSettings.find((s) => s.key === "maintenance_message")?.value || "",
      });
    }
  }, [siteSettings]);

  const handleToggleFeature = async (key: string, enabled: boolean, currentRollout: number) => {
    try {
      await setFeatureFlag.mutateAsync({
        key,
        enabled,
        rolloutPercentage: currentRollout,
      });
      toast.success(`Feature ${key} ${enabled ? "activé" : "désactivé"}`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur");
    }
  };

  const handleRolloutChange = async (key: string, enabled: boolean, rollout: number) => {
    try {
      await setFeatureFlag.mutateAsync({
        key,
        enabled,
        rolloutPercentage: rollout,
      });
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur");
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      await setMaintenanceMode.mutateAsync({
        enabled,
        message: localSettings.maintenanceMessage,
      });
      toast.success(`Mode maintenance ${enabled ? "activé" : "désactivé"}`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur");
    }
  };

  const handlePurgeCache = async () => {
    try {
      const result = await purgeCache.mutateAsync();
      toast.success(`Cache purgé - ${result.message}`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur lors du purge");
    }
  };

  const handleExportNewsletter = async () => {
    try {
      const csvData = await exportNewsletter.mutateAsync();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export newsletter téléchargé');
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Erreur lors de l\'export');
    }
  };

  const handleBackup = async (type: string) => {
    try {
      const backupId = await triggerBackup.mutateAsync(type);
      toast.success(`Backup démarré (ID: ${backupId.slice(0, 8)}...)`);
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || 'Erreur backup');
    }
  };

  const handleSaveGeneralSettings = async () => {
    try {
      await Promise.all([
        setSiteSetting.mutateAsync({
          key: "site_name",
          value: localSettings.siteName,
          description: "Nom du site",
        }),
        setSiteSetting.mutateAsync({
          key: "support_email",
          value: localSettings.supportEmail,
          description: "Email support",
        }),
      ]);
      toast.success("Parametres generaux sauvegardes");
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configuration</h1>
          <p className="text-sm text-slate-400 mt-1">
            Feature flags et paramètres système
          </p>
        </div>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="features" className="text-xs sm:text-sm">
            <ToggleLeft className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="text-xs sm:text-sm">
            <Newspaper className="h-4 w-4 mr-2" />
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <Database className="h-4 w-4 mr-2" />
            Système
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="promo" className="text-xs sm:text-sm">
            <Gift className="h-4 w-4 mr-2" />
            Promotion VIP
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
        </TabsList>

        {/* Feature Flags Tab */}
        <TabsContent value="features" className="mt-4 space-y-4">
          {flagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {featureFlags?.map((flag) => {
                const Icon = FEATURE_ICONS[flag.key] || Zap;
                return (
                  <Card key={flag.id} className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white">{flag.name}</h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  flag.enabled
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                                )}
                              >
                                {flag.enabled ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">
                              {flag.description || flag.key}
                            </p>
                            {flag.allowed_roles?.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">
                                Rôles: {flag.allowed_roles.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleFeature(flag.key, checked, flag.rollout_percentage)
                          }
                          disabled={setFeatureFlag.isPending}
                        />
                      </div>

                      {/* Rollout slider */}
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-slate-400">
                            Déploiement progressif ({flag.rollout_percentage}%)
                          </Label>
                        </div>
                        <Slider
                          value={[flag.rollout_percentage]}
                          onValueChange={([value]) =>
                            handleRolloutChange(flag.key, flag.enabled, value)
                          }
                          max={100}
                          step={5}
                          disabled={!flag.enabled || setFeatureFlag.isPending}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {flag.rollout_percentage === 100
                            ? "Tous les utilisateurs"
                            : `${flag.rollout_percentage}% des utilisateurs`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        {/* Promotion VIP Tab */}
        <TabsContent value="promo" className="mt-4 space-y-4">
          <PromoVipPanel />
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Mode Maintenance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Activez le mode maintenance pour empêcher l'accès au site pendant les mises à jour.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div>
                  <p className="font-medium text-amber-400">Mode Maintenance</p>
                  <p className="text-sm text-slate-400">
                    {maintenanceEnabled
                      ? "Le site est actuellement en maintenance"
                      : "Le site est accessible normalement"}
                  </p>
                </div>
                <Switch
                  checked={maintenanceEnabled}
                  onCheckedChange={handleMaintenanceToggle}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Message de maintenance</Label>
                <Input
                  value={localSettings.maintenanceMessage}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, maintenanceMessage: e.target.value })
                  }
                  placeholder="Message affiché aux utilisateurs..."
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-xs text-slate-500">
                  Ce message sera affiché aux utilisateurs pendant la maintenance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nom du site</Label>
                <Input
                  value={localSettings.siteName}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, siteName: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Email support</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <Input
                    value={localSettings.supportEmail}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, supportEmail: e.target.value })
                    }
                    type="email"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSaveGeneralSettings}
                disabled={settingsLoading || setSiteSetting.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>

          {/* Cache Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Cache & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                <div>
                  <p className="font-medium text-destructive">Purger le cache</p>
                  <p className="text-sm text-slate-400">
                    Force la réinitialisation du cache applicatif
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgeCache}
                  disabled={purgeCache.isPending}
                >
                  {purgeCache.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Purger
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Mail} label="Total" value={newsletterStats?.total_subscribers || 0} loading={newsletterLoading} color="bg-blue-500" />
            <StatCard icon={CheckCircle} label="Actifs" value={newsletterStats?.active_subscribers || 0} loading={newsletterLoading} color="bg-emerald-500" />
            <StatCard icon={Users} label="Nouveaux 7j" value={newsletterStats?.new_this_week || 0} loading={newsletterLoading} color="bg-amber-500" />
            <StatCard icon={CheckCircle} label="Confirmés %" value={`${newsletterStats?.confirmed_rate?.toFixed(1) || 0}%`} loading={newsletterLoading} color="bg-purple-500" />
          </div>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Gestion Newsletter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <p className="font-medium text-white">Export CSV</p>
                  <p className="text-sm text-slate-400">Télécharger la liste des abonnés actifs</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportNewsletter} disabled={exportNewsletter.isPending}>
                  {exportNewsletter.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Exporter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Activity} label="Requêtes API (7j)" value={apiStats?.total_requests || 0} loading={apiLoading} color="bg-blue-500" />
            <StatCard icon={AlertTriangle} label="Erreurs" value={apiStats?.total_errors || 0} loading={apiLoading} color="bg-red-500" />
            <StatCard icon={Clock} label="Temps moyen" value={`${apiStats?.avg_response_time || 0}ms`} loading={apiLoading} color="bg-emerald-500" />
          </div>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" />
                Sauvegardes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => handleBackup('full')} disabled={triggerBackup.isPending}>
                  <Database className="h-4 w-4 mr-2" />
                  Backup Complet
                </Button>
                <Button variant="outline" onClick={() => handleBackup('users')} disabled={triggerBackup.isPending}>
                  <Users className="h-4 w-4 mr-2" />
                  Backup Users
                </Button>
                <Button variant="outline" onClick={() => handleBackup('transactions')} disabled={triggerBackup.isPending}>
                  <Crown className="h-4 w-4 mr-2" />
                  Backup Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ─── PromoVipPanel ────────────────────────────────────────────────────────────

function PromoVipPanel() {
  const [metrics, setMetrics] = React.useState<Record<string, any> | null>(null);
  const [loadingMetrics, setLoadingMetrics] = React.useState(true);
  const [broadcasting, setBroadcasting] = React.useState(false);
  const [notifTitle, setNotifTitle] = React.useState("🌟 Offre VIP Exclusive LiveFoot");
  const [notifMsg, setNotifMsg] = React.useState("Profitez de 30 jours VIP gratuits — accédez à toutes les prédictions IA !");

  const loadMetrics = React.useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const { supabase: globalSupabase } = await import("@/integrations/supabase/client");
      const { data, error } = await (globalSupabase as any).rpc("get_promo_metrics");
      if (!error && data) setMetrics(data as Record<string, any>);
    } catch (e) {
      console.error("get_promo_metrics error:", e);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  React.useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      const { supabase: globalSupabase } = await import("@/integrations/supabase/client");
      const { data, error } = await (globalSupabase as any).functions.invoke("broadcast-promo-push", {
        body: { title: notifTitle, message: notifMsg, url: "/pricing" },
      });
      if (error) throw new Error(error.message);
      toast.success(`📣 Diffusion réussie — ${data?.sent ?? 0} notifications envoyées`);
    } catch (err: any) {
      toast.error("Erreur diffusion", err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleTogglePromo = async (enabled: boolean) => {
    try {
      const { supabase: globalSupabase } = await import("@/integrations/supabase/client");
      await (globalSupabase as any)
        .from("site_settings")
        .upsert({ key: "promo_vip_enabled", value: enabled ? "true" : "false", description: "Promotion VIP gratuite 30 jours activée" }, { onConflict: "key" });
      toast.success(`Promotion ${enabled ? "activée" : "désactivée"}`);
      loadMetrics();
    } catch (err: any) {
      toast.error("Erreur", err.message);
    }
  };

  const promoEnabled = metrics?.promo_enabled === "true";

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total essais", value: String(metrics?.total_trials ?? "—"), color: "bg-purple-500/20", Icon: Crown },
          { label: "Essais actifs", value: String(metrics?.active_trials ?? "—"), color: "bg-emerald-500/20", Icon: CheckCircle },
          { label: "Nouveaux inscrits", value: String(metrics?.new_signup_trials ?? "—"), color: "bg-blue-500/20", Icon: Users },
          { label: "IPs uniques", value: String(metrics?.unique_ips ?? "—"), color: "bg-amber-500/20", Icon: Activity },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-white">
                  {loadingMetrics ? <Loader2 className="h-4 w-4 animate-spin" /> : s.value}
                </p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promo toggle */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-400" />
            Contrôle de la promotion
          </CardTitle>
          <CardDescription className="text-slate-400">
            Date de fin: {metrics?.promo_end_date ? new Date(String(metrics.promo_end_date)).toLocaleDateString("fr-FR") : "—"}
            {" · "}Durée: {metrics?.promo_duration_days ?? "—"} jours
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-bold">Promotion VIP gratuite</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {promoEnabled ? "Active — les nouveaux inscrits reçoivent le VIP automatiquement" : "Désactivée"}
            </p>
          </div>
          <Switch
            checked={!!promoEnabled}
            onCheckedChange={handleTogglePromo}
          />
        </CardContent>
      </Card>

      {/* Broadcast notification */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Diffuser une notification push
          </CardTitle>
          <CardDescription className="text-slate-400">
            Envoyez une notification push à tous les abonnés pour promouvoir l'offre VIP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Titre</Label>
            <Input
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-sm"
              placeholder="Titre de la notification"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Message</Label>
            <Input
              value={notifMsg}
              onChange={(e) => setNotifMsg(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-sm"
              placeholder="Corps de la notification"
            />
          </div>
          <Button
            onClick={handleBroadcast}
            disabled={broadcasting}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black hover:scale-[1.02] transition-all"
          >
            {broadcasting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {broadcasting ? "Diffusion en cours…" : "Diffuser maintenant"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent trials table */}
      {Array.isArray(metrics?.recent_trials) && (metrics.recent_trials as unknown[]).length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Derniers essais VIP réclamés</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left pb-2">Utilisateur</th>
                  <th className="text-left pb-2">Source</th>
                  <th className="text-left pb-2">Réclamé le</th>
                  <th className="text-left pb-2">Expire le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(metrics.recent_trials as Array<Record<string, unknown>>).map((t, i) => (
                  <tr key={i} className="text-slate-300">
                    <td className="py-2">{String(t.display_name || t.user_id || "—").slice(0, 20)}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        t.source === "new_signup" ? "text-blue-400 border-blue-500/30" : "text-purple-400 border-purple-500/30"
                      )}>
                        {t.source === "new_signup" ? "Nouvel inscrit" : "Existant"}
                      </Badge>
                    </td>
                    <td className="py-2">{t.claimed_at ? new Date(String(t.claimed_at)).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="py-2">{t.expires_at ? new Date(String(t.expires_at)).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({

  icon: Icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  loading?: boolean;
  color: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : value}
            </p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
