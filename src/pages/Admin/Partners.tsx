import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Users,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Smartphone,
  MapPin,
  User,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Eye,
  MessageCircle
} from "lucide-react";

interface PartnerStats {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  referral_code: string;
  is_partner: boolean;
  partner_activated_at: string | null;
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  total_paid: number;
  total_referrals: number;
  paid_referrals: number;
  pending_payouts: number;
  partner_full_name: string | null;
  partner_country: string | null;
  partner_city: string | null;
  partner_whatsapp: string | null;
  is_partner_approved: boolean;
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  amount_fcfa: number;
  status: "pending" | "approved" | "rejected" | "paid";
  payment_method: string;
  payment_details: {
    operator: string;
    phone_number: string;
    full_name: string;
    country: string;
    city: string;
  };
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  user_display_name?: string;
  user_email?: string;
}

const EUR_TO_FCFA = 655.957;

const MOBILE_OPERATORS: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  wave: "Wave",
  moov_money: "Moov Money",
  free_money: "Free Money",
  other: "Autre"
};

export default function AdminPartners() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("payouts");
  const [partners, setPartners] = useState<PartnerStats[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch partners stats from the view
      const { data: partnersData, error: partnersError } = await supabase
        .from("admin_partner_stats")
        .select("*")
        .order("total_earned", { ascending: false });

      if (partnersError) {
        console.error("Error fetching partners:", partnersError);
      } else {
        setPartners(partnersData || []);
      }

      // Fetch payouts with user info
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("referral_payouts")
        .select(`
          *,
          profiles:user_id (display_name, email)
        `)
        .order("requested_at", { ascending: false });

      if (payoutsError) {
        console.error("Error fetching payouts:", payoutsError);
      } else {
        const formattedPayouts = (payoutsData || []).map(p => ({
          ...p,
          user_display_name: (p as any).profiles?.display_name,
          user_email: (p as any).profiles?.email
        }));
        setPayouts(formattedPayouts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    if (!selectedPayout || !user) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-payout", {
        body: {
          payoutId: selectedPayout.id,
          action: "approve"
        }
      });

      if (error) throw error;

      toast.success("Retrait approuvé avec succès !");
      setIsApproveModalOpen(false);
      setSelectedPayout(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !user || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-payout", {
        body: {
          payoutId: selectedPayout.id,
          action: "reject",
          rejectionReason: rejectionReason.trim()
        }
      });

      if (error) throw error;

      toast.success("Retrait rejeté");
      setIsRejectModalOpen(false);
      setSelectedPayout(null);
      setRejectionReason("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet");
    } finally {
      setProcessing(false);
    }
  };

  const pendingPayouts = payouts.filter(p => p.status === "pending");
  const approvedPayouts = payouts.filter(p => p.status === "approved" || p.status === "paid");
  const rejectedPayouts = payouts.filter(p => p.status === "rejected");

  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidAmount = approvedPayouts.reduce((sum, p) => sum + p.amount, 0);

  const filteredPartners = partners.filter(p =>
    searchQuery === "" ||
    p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Programme Partenaire</h1>
          <p className="text-sm text-white/60">Gestion des partenaires et retraits</p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/60">Partenaires</span>
          </div>
          <p className="text-2xl font-black text-white">{partners.length}</p>
          <p className="text-[10px] text-amber-400/70">actifs</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/60">Retraits en attente</span>
          </div>
          <p className="text-2xl font-black text-white">{pendingPayouts.length}</p>
          <p className="text-[10px] text-emerald-400/70">{totalPendingAmount.toFixed(2)}€</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-white/60">Total payé</span>
          </div>
          <p className="text-2xl font-black text-white">{totalPaidAmount.toFixed(2)}€</p>
          <p className="text-[10px] text-cyan-400/70">{Math.round(totalPaidAmount * EUR_TO_FCFA).toLocaleString()} FCFA</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-white/60">Généré par les parts</span>
          </div>
          <p className="text-2xl font-black text-white">
            {partners.reduce((sum, p) => sum + (p.total_earned || 0), 0).toFixed(2)}€
          </p>
          <p className="text-[10px] text-violet-400/70">tous partenaires</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 p-1 rounded-xl">
          <TabsTrigger value="payouts" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Retraits
            {pendingPayouts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                {pendingPayouts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="partners" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Partenaires
          </TabsTrigger>
        </TabsList>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="mt-4">
          {pendingPayouts.length === 0 && approvedPayouts.length === 0 && rejectedPayouts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
              <Wallet className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">Aucune demande de retrait</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    En attente ({pendingPayouts.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingPayouts.map((payout) => (
                      <motion.div
                        key={payout.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-[#0a0d14] border border-amber-500/20 p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{payout.user_display_name || "Utilisateur"}</p>
                              <p className="text-xs text-white/40">{payout.user_email}</p>
                              <p className="text-sm font-bold text-amber-400 mt-1">
                                {payout.amount.toFixed(2)}€ = {Math.round(payout.amount_fcfa).toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col md:text-right">
                            <div className="flex items-center gap-2 text-sm text-white/60">
                              <Smartphone className="h-4 w-4" />
                              {MOBILE_OPERATORS[payout.payment_method] || payout.payment_method}
                            </div>
                            <p className="text-xs text-white/40">{payout.payment_details.phone_number}</p>
                            <p className="text-[10px] text-white/30">
                              {payout.payment_details.full_name} — {payout.payment_details.city}, {payout.payment_details.country}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedPayout(payout);
                                setIsApproveModalOpen(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedPayout(payout);
                                setIsRejectModalOpen(true);
                              }}
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/30 mt-3">
                          Demandé le {format(parseISO(payout.requested_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Payouts */}
              {approvedPayouts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Payés / Approuvés
                  </h3>
                  <div className="space-y-3">
                    {approvedPayouts.slice(0, 5).map((payout) => (
                      <div
                        key={payout.id}
                        className="rounded-2xl bg-[#0a0d14] border border-white/10 p-4 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            <div>
                              <p className="font-bold text-white text-sm">{payout.user_display_name || "Utilisateur"}</p>
                              <p className="text-xs text-white/40">
                                {payout.amount.toFixed(2)}€ via {MOBILE_OPERATORS[payout.payment_method] || payout.payment_method}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-white/40">
                            {payout.processed_at && format(parseISO(payout.processed_at), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Rechercher un partenaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">Aucun partenaire trouvé</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0a0d14] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-xs font-bold text-white/40">Partenaire</th>
                      <th className="text-left p-4 text-xs font-bold text-white/40">Filleuls</th>
                      <th className="text-left p-4 text-xs font-bold text-white/40">Gains</th>
                      <th className="text-left p-4 text-xs font-bold text-white/40">Disponible</th>
                      <th className="text-left p-4 text-xs font-bold text-white/40">Payé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map((partner) => (
                      <tr key={partner.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-white text-sm">{partner.display_name || "Sans nom"}</p>
                            <p className="text-[10px] text-white/40">{partner.email}</p>
                            {partner.partner_country && (
                              <p className="text-[10px] text-white/30 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {partner.partner_city}, {partner.partner_country}
                              </p>
                            )}
                            {partner.partner_whatsapp && (
                              <p className="text-[10px] text-[#25D366] flex items-center gap-1 mt-0.5">
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp: {partner.partner_whatsapp}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-cyan-400" />
                            <span className="text-sm text-white">{partner.total_referrals}</span>
                          </div>
                          <p className="text-[10px] text-white/40">{partner.paid_referrals} payants</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-emerald-400">
                            {partner.total_earned?.toFixed(2) || "0.00"}€
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-white">
                            {partner.available_balance?.toFixed(2) || "0.00"}€
                          </p>
                          {partner.pending_payouts > 0 && (
                            <span className="text-[10px] text-amber-400">
                              {partner.pending_payouts} retrait en attente
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-white/60">
                            {partner.total_paid?.toFixed(2) || "0.00"}€
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="bg-[#0a0d14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Approuver le retrait</DialogTitle>
            <DialogDescription className="text-white/60">
              Confirme le paiement vers le compte mobile money
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Montant</span>
                  <span className="font-bold text-white">{selectedPayout.amount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">En FCFA</span>
                  <span className="font-bold text-emerald-400">{Math.round(selectedPayout.amount_fcfa).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Opérateur</span>
                  <span className="text-white">{MOBILE_OPERATORS[selectedPayout.payment_method] || selectedPayout.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Numéro</span>
                  <span className="text-white font-mono">{selectedPayout.payment_details.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Bénéficiaire</span>
                  <span className="text-white">{selectedPayout.payment_details.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Localisation</span>
                  <span className="text-white">{selectedPayout.payment_details.city}, {selectedPayout.payment_details.country}</span>
                </div>

                {/* WhatsApp Contact */}
                {(() => {
                  const partner = partners.find(p => p.user_id === selectedPayout.user_id);
                  return partner?.partner_whatsapp ? (
                    <div className="pt-2 mt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#25D366] flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp Contact
                        </span>
                        <span className="text-white font-mono">{partner.partner_whatsapp}</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">
                        Contacte le partenaire sur WhatsApp avant de faire le transfert
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>

              <p className="text-xs text-amber-400/70">
                ⚠️ Assure-toi d'avoir effectué le transfert mobile money avant d'approuver.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              {processing ? "Traitement..." : "Confirmer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="bg-[#0a0d14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeter le retrait</DialogTitle>
            <DialogDescription className="text-white/60">
              Explique pourquoi tu refuses cette demande
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Raison du rejet</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Numéro de téléphone invalide, informations incorrectes..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="bg-red-500 hover:bg-red-400 text-white font-bold"
            >
              {processing ? "Traitement..." : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
