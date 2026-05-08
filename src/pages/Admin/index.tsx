import { useState } from "react";
import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Star,
  Heart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  description: string;
  href: string;
  color: string;
}

function StatCard({ title, value, change, changeType = "neutral", icon: Icon, description, href, color }: StatCardProps) {
  return (
    <Link to={href}>
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300 group cursor-pointer hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
                {change && (
                  <div className={cn(
                    "flex items-center gap-1 mt-2 text-xs font-medium",
                    changeType === "positive" && "text-emerald-400",
                    changeType === "negative" && "text-red-400",
                    changeType === "neutral" && "text-slate-400"
                  )}>
                    {changeType === "positive" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : changeType === "negative" ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {change}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">{description}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: "Utilisateurs Totaux",
      value: stats?.total_users || 0,
      change: `+${stats?.recent_signups_7d || 0} cette semaine`,
      changeType: "positive",
      icon: Users,
      description: "Utilisateurs inscrits sur la plateforme",
      href: "/admin/users",
      color: "bg-blue-500",
    },
    {
      title: "Pronostics",
      value: stats?.total_predictions || 0,
      change: `${stats?.users_with_predictions || 0} participants`,
      changeType: "neutral",
      icon: Trophy,
      description: "Total des pronostics communautaire",
      href: "/admin/content",
      color: "bg-emerald-500",
    },
    {
      title: "Notes Joueurs",
      value: stats?.total_ratings || 0,
      change: `${stats?.users_with_ratings || 0} votants`,
      changeType: "neutral",
      icon: Star,
      description: "Évaluations déposées par les utilisateurs",
      href: "/admin/content",
      color: "bg-amber-500",
    },
    {
      title: "Favoris",
      value: stats?.total_favorites || 0,
      icon: Heart,
      description: "Éléments ajoutés aux favoris",
      href: "/admin/content",
      color: "bg-rose-500",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Vue d'ensemble de votre application LiveFoot
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {(["24h", "7d", "30d", "all"] as const).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "text-xs",
                timeRange === range
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              {range === "24h" ? "24h" : range === "7d" ? "7 jours" : range === "30d" ? "30 jours" : "Tout"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickActionButton
                icon={Users}
                label="Gérer utilisateurs"
                href="/admin/users"
                color="bg-blue-500/10 text-blue-400 border-blue-500/20"
              />
              <QuickActionButton
                icon={Trophy}
                label="Modérer pronostics"
                href="/admin/content"
                color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              />
              <QuickActionButton
                icon={DollarSign}
                label="Transactions VIP"
                href="/admin/monetization"
                color="bg-amber-500/10 text-amber-400 border-amber-500/20"
              />
              <QuickActionButton
                icon={BarChart3}
                label="Voir analytics"
                href="/admin/analytics"
                color="bg-purple-500/10 text-purple-400 border-purple-500/20"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activité Récente
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-slate-400">
                Voir tout
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  icon={Users}
                  title="Nouvel utilisateur"
                  description="Jean D. vient de s'inscrire"
                  time="2 min"
                  color="text-blue-400 bg-blue-500/10"
                />
                <ActivityItem
                  icon={Trophy}
                  title="Pronostic validé"
                  description="Real Madrid vs Barcelona - 2-1"
                  time="15 min"
                  color="text-emerald-400 bg-emerald-500/10"
                />
                <ActivityItem
                  icon={Star}
                  title="Note déposée"
                  description="Mbappé noté 8.5/10"
                  time="1h"
                  color="text-amber-400 bg-amber-500/10"
                />
                <ActivityItem
                  icon={Heart}
                  title="Ajout favori"
                  description="PSG ajouté aux favoris"
                  time="2h"
                  color="text-rose-400 bg-rose-500/10"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Santé du Système
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">Opérationnel</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthBar label="API-Football" value={98} status="optimal" />
              <HealthBar label="Base de données" value={100} status="optimal" />
              <HealthBar label="Cache Redis" value={95} status="good" />
              <HealthBar label="Edge Functions" value={92} status="good" />
              <HealthBar label="AI Predictions" value={87} status="warning" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        color
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}

function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>
    </div>
  );
}

function HealthBar({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: "optimal" | "good" | "warning" | "critical";
}) {
  const colors = {
    optimal: "bg-emerald-500",
    good: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={cn("font-medium", colors[status].replace("bg-", "text-"))}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", colors[status])}
        />
      </div>
    </div>
  );
}
