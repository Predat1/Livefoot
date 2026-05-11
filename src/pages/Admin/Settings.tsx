import { useState } from "react";
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
} from "lucide-react";

const FEATURE_ICONS: Record<string, any> = {
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

  const maintenanceEnabled = siteSettings?.find((s) => s.key === "maintenance_mode")?.value === "true";
  const maintenanceMessage = siteSettings?.find((s) => s.key === "maintenance_message")?.value || "";
  const siteName = siteSettings?.find((s) => s.key === "site_name")?.value || "LiveFoot";
  const supportEmail = siteSettings?.find((s) => s.key === "support_email")?.value || "";

  const [localSettings, setLocalSettings] = useState({
    siteName,
    supportEmail,
    maintenanceMessage,
  });

  const handleToggleFeature = async (key: string, enabled: boolean, currentRollout: number) => {
    try {
      await setFeatureFlag.mutateAsync({
        key,
        enabled,
        rolloutPercentage: currentRollout,
      });
      toast.success(`Feature ${key} ${enabled ? "activé" : "désactivé"}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const handleRolloutChange = async (key: string, enabled: boolean, rollout: number) => {
    try {
      await setFeatureFlag.mutateAsync({
        key,
        enabled,
        rolloutPercentage: rollout,
      });
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      await setMaintenanceMode.mutateAsync({
        enabled,
        message: localSettings.maintenanceMessage,
      });
      toast.success(`Mode maintenance ${enabled ? "activé" : "désactivé"}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const handlePurgeCache = async () => {
    try {
      const result = await purgeCache.mutateAsync();
      toast.success(`Cache purgé - ${result.message}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du purge");
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
          <TabsTrigger value="maintenance" className="text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
        </TabsTrigger>

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

              <Button className="w-full" disabled={settingsLoading}>
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
      </Tabs>
    </motion.div>
  );
}
