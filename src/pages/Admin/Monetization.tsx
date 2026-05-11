import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useAdminRevenueStats,
  useAdminTransactions,
  useAdminPartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  type Partner,
  type Transaction,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  MousePointerClick,
  Target,
  Crown,
  Building2,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

const PARTNER_TYPES = [
  { value: "affiliate", label: "Affilié" },
  { value: "bookmaker", label: "Bookmaker" },
  { value: "sponsor", label: "Sponsor" },
  { value: "content", label: "Contenu" },
];

export default function AdminMonetization() {
  const { data: stats, isLoading: statsLoading } = useAdminRevenueStats();
  const { data: transactions, isLoading: transactionsLoading } = useAdminTransactions(50);
  const { data: partners, isLoading: partnersLoading } = useAdminPartners();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Monétisation & VIP</h1>
          <p className="text-sm text-slate-400 mt-1">
            Transactions, partenaires et revenus
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RevenueCard
          icon={DollarSign}
          label="Revenus Totaux"
          value={stats?.total_revenue_eur || 0}
          format="currency"
          loading={statsLoading}
          color="bg-emerald-500"
        />
        <RevenueCard
          icon={TrendingUp}
          label="30 jours"
          value={stats?.revenue_30d_eur || 0}
          format="currency"
          loading={statsLoading}
          color="bg-blue-500"
        />
        <RevenueCard
          icon={Users}
          label="Transactions"
          value={stats?.transactions_count || 0}
          format="number"
          loading={statsLoading}
          color="bg-purple-500"
        />
        <RevenueCard
          icon={MousePointerClick}
          label="Clics Partenaires"
          value={stats?.total_clicks || 0}
          format="number"
          loading={statsLoading}
          color="bg-amber-500"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              Répartition par Méthode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PaymentMethodRow
              icon={CreditCard}
              label="Stripe"
              value={stats?.stripe_revenue || 0}
              total={stats?.total_revenue_eur || 1}
              loading={statsLoading}
            />
            <PaymentMethodRow
              icon={RefreshCw}
              label="PayPal"
              value={stats?.paypal_revenue || 0}
              total={stats?.total_revenue_eur || 1}
              loading={statsLoading}
            />
            <PaymentMethodRow
              icon={DollarSign}
              label="Crypto"
              value={stats?.crypto_revenue || 0}
              total={stats?.total_revenue_eur || 1}
              loading={statsLoading}
            />
            <PaymentMethodRow
              icon={Crown}
              label="Chariow"
              value={stats?.chariow_revenue || 0}
              total={stats?.total_revenue_eur || 1}
              loading={statsLoading}
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              KPIs Clés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <KPIRow label="ARPU" value={`${stats?.arpu_eur?.toFixed(2) || "0.00"} €`} />
            <KPIRow label="Conversions" value={stats?.total_conversions || 0} />
            <KPIRow label="En attente" value={stats?.pending_count || 0} color="text-amber-400" />
            <KPIRow label="Échoués" value={stats?.failed_count || 0} color="text-red-400" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">
              Revenus Partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total généré</span>
              <span className="font-bold text-white">
                {statsLoading ? "..." : `${stats?.partner_revenue_eur?.toFixed(2) || "0.00"} €`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Clics</span>
              <span className="font-medium text-slate-200">{stats?.total_clicks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Conversions</span>
              <span className="font-medium text-emerald-400">{stats?.total_conversions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taux conv.</span>
              <span className="font-medium text-white">
                {stats?.total_clicks && stats.total_clicks > 0
                  ? ((stats.total_conversions / stats.total_clicks) * 100).toFixed(1)
                  : "0.0"}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="partners" className="text-xs sm:text-sm">
            Partenaires ({partners?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsTab
            transactions={transactions || []}
            isLoading={transactionsLoading}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-4">
          <PartnersTab
            partners={partners || []}
            isLoading={partnersLoading}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function RevenueCard({
  icon: Icon,
  label,
  value,
  format,
  loading,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  format: "currency" | "number";
  loading: boolean;
  color: string;
}) {
  const formattedValue =
    format === "currency"
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(value)
      : new Intl.NumberFormat("fr-FR").format(value);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formattedValue}
            </p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentMethodRow({
  icon: Icon,
  label,
  value,
  total,
  loading,
}: {
  icon: any;
  label: string;
  value: number;
  total: number;
  loading: boolean;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="text-slate-300">{label}</span>
        </div>
        <span className="font-medium text-white">
          {loading ? "..." : `${value.toFixed(2)} €`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function KPIRow({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={cn("font-bold", color)}>{value}</span>
    </div>
  );
}

function TransactionsTab({
  transactions,
  isLoading,
}: {
  transactions: Transaction[];
  isLoading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTransactions = transactions.filter((t) =>
    statusFilter === "all" ? true : t.status === statusFilter
  );

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      completed: { icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10", label: "Complété" },
      pending: { icon: Clock, color: "text-amber-400 bg-amber-500/10", label: "En attente" },
      failed: { icon: XCircle, color: "text-red-400 bg-red-500/10", label: "Échoué" },
      refunded: { icon: RefreshCw, color: "text-slate-400 bg-slate-500/10", label: "Remboursé" },
    };
    return configs[status] || { icon: Clock, color: "text-slate-400", label: status };
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Transactions Récentes
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="completed">Complétés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="failed">Échoués</SelectItem>
              <SelectItem value="refunded">Remboursés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead className="bg-slate-800/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Utilisateur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Méthode
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTransactions.map((t) => {
                  const statusConfig = getStatusConfig(t.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {format(new Date(t.created_at), "dd/MM HH:mm", { locale: fr })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-200">{t.user_email}</div>
                        {t.partner_name && (
                          <div className="text-xs text-slate-500">via {t.partner_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 capitalize">
                        {t.type === "vip_subscription" ? "VIP" : t.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                        {t.payment_method || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {t.amount_eur.toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function PartnersTab({
  partners,
  isLoading,
}: {
  partners: Partner[];
  isLoading: boolean;
}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();

  const handleCreate = async (data: Partial<Partner>) => {
    try {
      await createPartner.mutateAsync({
        name: data.name!,
        type: data.type!,
        websiteUrl: data.website_url || undefined,
        commissionRate: data.commission_rate || undefined,
        flatAmount: data.flat_amount_eur || undefined,
        contactEmail: data.contact_email || undefined,
        contactName: data.contact_name || undefined,
        notes: data.notes || undefined,
      });
      toast.success("Partenaire créé avec succès");
      setIsCreateDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    }
  };

  const handleUpdate = async (partnerId: string, updates: Partial<Partner>) => {
    try {
      await updatePartner.mutateAsync({
        partnerId,
        ...updates,
      });
      toast.success("Partenaire mis à jour");
      setEditingPartner(null);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver ce partenaire ?")) return;
    try {
      await deletePartner.mutateAsync(partnerId);
      toast.success("Partenaire désactivé");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    }
  };

  const copyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${code}`);
    toast.success("Lien de tracking copié");
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Partenaires
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Nouveau Partenaire</DialogTitle>
              </DialogHeader>
              <PartnerForm onSubmit={handleCreate} isLoading={createPartner.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className={cn(
                    "bg-slate-800/50 rounded-lg p-4 border transition-all",
                    partner.is_active ? "border-slate-700" : "border-slate-800 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{partner.name}</h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {PARTNER_TYPES.find((t) => t.value === partner.type)?.label || partner.type}
                        </Badge>
                        {!partner.is_active && (
                          <Badge variant="outline" className="text-xs text-slate-500">
                            Inactif
                          </Badge>
                        )}
                      </div>

                      {partner.website_url && (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {partner.website_url}
                        </a>
                      )}

                      {partner.contact_email && (
                        <p className="text-xs text-slate-500 mt-1">
                          Contact: {partner.contact_name || "-"} ({partner.contact_email})
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {partner.commission_rate && (
                          <span className="text-slate-400">
                            Commission: <span className="text-emerald-400">{partner.commission_rate}%</span>
                          </span>
                        )}
                        {partner.flat_amount_eur && (
                          <span className="text-slate-400">
                            Flat: <span className="text-emerald-400">{partner.flat_amount_eur}€</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-slate-500">
                          <MousePointerClick className="h-3.5 w-3.5 inline mr-1" />
                          {partner.click_count} clics
                        </span>
                        <span className="text-slate-500">
                          <Target className="h-3.5 w-3.5 inline mr-1" />
                          {partner.conversion_count} conv.
                        </span>
                        <span className="text-slate-500">
                          <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                          {partner.revenue_eur.toFixed(2)}€
                        </span>
                      </div>

                      {partner.tracking_code && (
                        <div className="flex items-center gap-2 mt-3">
                          <code className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">
                            {partner.tracking_code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => copyTrackingCode(partner.tracking_code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Dialog
                        open={editingPartner?.id === partner.id}
                        onOpenChange={(open) => !open && setEditingPartner(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingPartner(partner)}
                          >
                            <Pencil className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-white">Modifier {partner.name}</DialogTitle>
                          </DialogHeader>
                          <PartnerForm
                            partner={partner}
                            onSubmit={(data) => handleUpdate(partner.id, data)}
                            isLoading={updatePartner.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(partner.id)}
                        disabled={deletePartner.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {partners.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucun partenaire enregistré</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function PartnerForm({
  partner,
  onSubmit,
  isLoading,
}: {
  partner?: Partner;
  onSubmit: (data: Partial<Partner>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Partner>>({
    name: partner?.name || "",
    type: partner?.type || "affiliate",
    website_url: partner?.website_url || "",
    commission_rate: partner?.commission_rate || 0,
    flat_amount_eur: partner?.flat_amount_eur || 0,
    contact_email: partner?.contact_email || "",
    contact_name: partner?.contact_name || "",
    notes: partner?.notes || "",
    is_active: partner?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Nom</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom du partenaire"
            className="bg-slate-800 border-slate-700"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PARTNER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Site web</Label>
        <Input
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          placeholder="https://..."
          className="bg-slate-800 border-slate-700"
          type="url"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Commission (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.commission_rate || ""}
            onChange={(e) =>
              setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })
            }
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Montant fixe (€)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.flat_amount_eur || ""}
            onChange={(e) =>
              setFormData({ ...formData, flat_amount_eur: parseFloat(e.target.value) || 0 })
            }
            className="bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-300">Contact</Label>
          <Input
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder="Nom"
            className="bg-slate-800 border-slate-700"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Email contact</Label>
          <Input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder="email@example.com"
            className="bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Notes</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes internes..."
          className="bg-slate-800 border-slate-700"
        />
      </div>

      {partner && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-slate-600 bg-slate-800"
          />
          <Label htmlFor="is_active" className="text-sm text-slate-400">
            Partenaire actif
          </Label>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : partner ? (
          "Mettre à jour"
        ) : (
          "Créer le partenaire"
        )}
      </Button>
    </form>
  );
}
