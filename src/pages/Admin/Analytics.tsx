import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useAdminAnalyticsStats,
  useImportPlausible,
  type PlausibleRow,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  Globe,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Calendar,
  Clock,
  Target,
  DollarSign,
  Loader2,
  ExternalLink,
} from "lucide-react";

const PERIODS = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
];

const DEVICE_ICONS: Record<string, any> = {
  mobile: Smartphone,
  desktop: BarChart3,
  tablet: Smartphone,
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30");
  const { data: stats, isLoading } = useAdminAnalyticsStats(parseInt(period));
  const importPlausible = useImportPlausible();

  const handleImportPlausible = async () => {
    // Simulation d'import - dans la vraie vie, on parserait un CSV
    const mockData: PlausibleRow[] = [
      {
        date: new Date().toISOString().split("T")[0],
        visitors: 150,
        pageviews: 320,
        bounce_rate: 45.5,
        avg_duration: 120,
        source: "Google",
        country: "France",
        device_type: "desktop",
      },
    ];

    try {
      const count = await importPlausible.mutateAsync(mockData);
      toast.success(`${count} lignes importées de Plausible`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'import");
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
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audience et comportement des utilisateurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
              <Calendar className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleImportPlausible}>
            <Upload className="h-4 w-4 mr-2" />
            Import Plausible
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard
          icon={Users}
          label="Visiteurs uniques"
          internal={stats?.internal_visitors || 0}
          plausible={stats?.plausible_visitors || 0}
          loading={isLoading}
          color="bg-blue-500"
        />
        <AnalyticsCard
          icon={Eye}
          label="Pages vues"
          internal={stats?.internal_pageviews || 0}
          plausible={stats?.plausible_pageviews || 0}
          loading={isLoading}
          color="bg-emerald-500"
        />
        <AnalyticsCard
          icon={Clock}
          label="Durée moyenne"
          internal={stats?.internal_avg_duration || 0}
          plausible={stats?.plausible_avg_bounce || 0}
          loading={isLoading}
          color="bg-amber-500"
          format="duration"
        />
        <AnalyticsCard
          icon={Target}
          label="Conversions"
          internal={stats?.total_conversions || 0}
          value={stats?.conversion_value_eur || 0}
          loading={isLoading}
          color="bg-purple-500"
          format="currency"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="pages" className="text-xs sm:text-sm">
            Top Pages
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs sm:text-sm">
            Sources
          </TabsTrigger>
          <TabsTrigger value="devices" className="text-xs sm:text-sm">
            Appareils
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Pages */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Pages vues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {stats?.top_pages?.map((page, i) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 w-6">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-300 truncate max-w-[200px]">
                            {page.path}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {page.views} vues
                        </Badge>
                      </div>
                    ))}
                    {!stats?.top_pages?.length && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Aucune donnée disponible
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Top Pays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {stats?.top_countries?.map((country, i) => (
                      <div
                        key={country.country_code}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 w-6">
                            {i + 1}
                          </span>
                          <span className="text-lg">{getFlag(country.country_code)}</span>
                          <span className="text-sm text-slate-300">
                            {country.country_code}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {country.visitors} visiteurs
                        </Badge>
                      </div>
                    ))}
                    {!stats?.top_countries?.length && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Aucune donnée disponible
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                Toutes les pages populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">
                      Page
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-slate-400 uppercase">
                      Vues
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-slate-400 uppercase">
                      % du total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats?.top_pages?.map((page) => {
                    const total = stats.internal_pageviews || 1;
                    const percent = ((page.views / total) * 100).toFixed(1);
                    return (
                      <tr key={page.path} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm text-slate-300">{page.path}</td>
                        <td className="px-4 py-3 text-sm text-right text-white font-medium">
                          {page.views}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-400">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                Sources de trafic (Plausible)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.plausible_sources?.map((source) => (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{source.source}</span>
                      <span className="text-white font-medium">
                        {source.visitors} visiteurs
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(
                            (source.visitors / (stats.plausible_visitors || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {!stats?.plausible_sources?.length && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Importez des données Plausible pour voir les sources
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">
                Répartition des appareils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats?.device_breakdown &&
                  Object.entries(stats.device_breakdown).map(([device, count]) => {
                    const Icon = DEVICE_ICONS[device] || Smartphone;
                    const total = Object.values(stats.device_breakdown).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percent = ((count / total) * 100).toFixed(1);

                    return (
                      <div
                        key={device}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-white capitalize">{device}</p>
                            <p className="text-xs text-slate-400">{count} sessions</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-slate-400 mt-1">{percent}%</p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Tracking interne</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Données collectées en temps réel via les Edge Functions Supabase.
                  Aucune IP n'est stockée, les sessions sont anonymisées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Import Plausible</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Importez vos données historiques Plausible pour comparer et analyser
                  les tendances sur le long terme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function AnalyticsCard({
  icon: Icon,
  label,
  internal,
  plausible,
  value,
  loading,
  color,
  format = "number",
}: {
  icon: any;
  label: string;
  internal?: number;
  plausible?: number;
  value?: number;
  loading: boolean;
  color: string;
  format?: "number" | "currency" | "duration";
}) {
  const displayValue = value !== undefined ? value : internal || plausible || 0;

  const formatted =
    format === "currency"
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(displayValue)
      : format === "duration"
      ? `${Math.floor(displayValue / 60)}m ${displayValue % 60}s`
      : new Intl.NumberFormat("fr-FR").format(displayValue);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-black text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatted}
            </p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
        {internal !== undefined && plausible !== undefined && plausible > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Interne</span>
              <span className="text-slate-300">{internal}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-500">Plausible</span>
              <span className="text-slate-300">{plausible}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    FR: "🇫🇷",
    BE: "🇧🇪",
    CH: "🇨🇭",
    CA: "🇨🇦",
    DE: "🇩🇪",
    ES: "🇪🇸",
    IT: "🇮🇹",
    UK: "🇬🇧",
    US: "🇺🇸",
    MA: "🇲🇦",
    DZ: "🇩🇿",
    TN: "🇹🇳",
    SN: "🇸🇳",
    CI: "🇨🇮",
    CM: "🇨🇲",
    GA: "🇬🇦",
    CG: "🇨🇬",
    CD: "🇨🇩",
    MG: "🇲🇬",
    MU: "🇲🇺",
    RE: "🇷🇪",
    GP: "🇬🇵",
    MQ: "🇲🇶",
    GF: "🇬🇫",
    PF: "🇵🇫",
    NC: "🇳🇨",
    WF: "🇼🇫",
    PM: "🇵🇲",
    BL: "🇧🇱",
    MF: "🇲🇫",
    SX: "🇸🇽",
    AW: "🇦🇼",
    CW: "🇨🇼",
    BQ: "🇧🇶",
  };
  return flags[countryCode?.toUpperCase()] || "🌍";
}
