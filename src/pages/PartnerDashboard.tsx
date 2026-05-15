import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { usePartner } from "@/hooks/usePartner";
import { usePartnerPayouts } from "@/hooks/usePartnerPayouts";
import { useCommissions } from "@/hooks/useCommissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Wallet,
  Users,
  TrendingUp,
  Gift,
  Crown,
  Copy,
  Check,
  Banknote,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Smartphone,
  MapPin,
  User,
  CreditCard,
  Zap,
  Target,
  Share2,
  ChevronRight,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PartnerMarketing from "@/components/PartnerMarketing";

const MOBILE_OPERATORS = [
  { value: "orange_money", label: "Orange Money", icon: "🟠" },
  { value: "mtn_momo", label: "MTN MoMo", icon: "🟡" },
  { value: "wave", label: "Wave", icon: "🔵" },
  { value: "moov_money", label: "Moov Money", icon: "🟣" },
  { value: "free_money", label: "Free Money", icon: "🟢" },
  { value: "other", label: "Autre", icon: "💳" },
];

const EUR_TO_FCFA = 655.957;

function getCommissionTierInfo(count: number) {
  if (count >= 101) return { rate: 30, tier: "Expert", next: null, color: "text-emerald-400" };
  if (count >= 51) return { rate: 25, tier: "Pro", next: 101, color: "text-amber-400" };
  if (count >= 31) return { rate: 20, tier: "Avancé", next: 51, color: "text-blue-400" };
  if (count >= 16) return { rate: 15, tier: "Intermédiaire", next: 31, color: "text-violet-400" };
  if (count >= 5) return { rate: 10, tier: "Débutant", next: 16, color: "text-cyan-400" };
  return { rate: 0, tier: "Invité", next: 5, color: "text-slate-400" };
}

export default function PartnerDashboard() {
  const { user, profile } = useAuth();
  const { partnerProfile, referralStats, loading: partnerLoading, savePartnerProfile, canRequestPayout } = usePartner();
  const { balance, payouts, loading: payoutsLoading, requestPayout, canRequestPayout: canRequestAmount, hasPendingPayout } = usePartnerPayouts();
  const { commissions, stats, loading: commissionsLoading } = useCommissions();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  // Onboarding form state
  const [fullName, setFullName] = useState(partnerProfile?.full_name || "");
  const [country, setCountry] = useState(partnerProfile?.country || "");
  const [city, setCity] = useState(partnerProfile?.city || "");
  const [whatsappNumber, setWhatsappNumber] = useState(partnerProfile?.whatsapp_number || "");
  const [operator, setOperator] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState("30");
  const [requesting, setRequesting] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Connecte-toi pour accéder à ton espace partenaire.</p>
          <Link to="/auth" className="mt-4 inline-block text-primary font-bold">Se connecter</Link>
        </div>
      </Layout>
    );
  }

  const referralCode = profile?.referral_code || "";
  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const tierInfo = getCommissionTierInfo(referralStats?.totalReferrals || 0);
  const isPartnerActive = (referralStats?.totalReferrals || 0) >= 5;
  const progressTo48h = Math.min(100, ((referralStats?.totalReferrals || 0) / 10) * 100);

  const handleSaveProfile = async () => {
    if (!fullName || !country || !city || !whatsappNumber || !operator || !phoneNumber) {
      toast.error("Tous les champs sont obligatoires, y compris WhatsApp");
      return;
    }

    // Validate WhatsApp number format (basic validation)
    if (whatsappNumber.length < 10) {
      toast.error("Numéro WhatsApp invalide");
      return;
    }

    setSavingProfile(true);
    try {
      await savePartnerProfile({
        full_name: fullName,
        country,
        city,
        whatsapp_number: whatsappNumber,
        payment_methods: [{ operator, phone_number: phoneNumber, is_default: true }]
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 30) {
      toast.error("Le montant minimum est de 30€");
      return;
    }

    if (!partnerProfile) {
      toast.error("Complète d'abord ton profil partenaire");
      setActiveTab("profile");
      return;
    }

    const paymentMethod = partnerProfile.payment_methods?.[0];
    if (!paymentMethod) {
      toast.error("Ajoute une méthode de paiement dans ton profil");
      setActiveTab("profile");
      return;
    }

    setRequesting(true);
    try {
      await requestPayout(amount, {
        operator: paymentMethod.operator,
        phone_number: paymentMethod.phone_number,
        full_name: partnerProfile.full_name,
        country: partnerProfile.country,
        city: partnerProfile.city
      });
      setPayoutAmount("30");
    } finally {
      setRequesting(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/60">Filleuls</span>
          </div>
          <p className="text-2xl font-black text-white">{referralStats?.totalReferrals || 0}</p>
          <p className="text-[10px] text-amber-400/70">{referralStats?.paidReferrals || 0} payants</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/60">Disponible</span>
          </div>
          <p className="text-2xl font-black text-white">{balance?.available_balance?.toFixed(2) || "0.00"}€</p>
          <p className="text-[10px] text-emerald-400/70">{Math.round((balance?.available_balance || 0) * EUR_TO_FCFA).toLocaleString()} FCFA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-white/60">Total gagné</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalEarned.toFixed(2)}€</p>
          <p className="text-[10px] text-violet-400/70">Ce mois: {stats.thisMonth.toFixed(2)}€</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "rounded-2xl border p-4",
            isPartnerActive
              ? "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20"
              : "bg-white/5 border-white/10"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className={cn("h-4 w-4", isPartnerActive ? "text-cyan-400" : "text-white/40")} />
            <span className="text-xs text-white/60">Commission</span>
          </div>
          <p className={cn("text-2xl font-black", tierInfo.color)}>{tierInfo.rate}%</p>
          <p className="text-[10px] text-white/40">Niveau {tierInfo.tier}</p>
        </motion.div>
      </div>

      {/* Progress to 48h VIP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-[#0a0d14] border border-white/10 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white">Progression vers 48h VIP gratuit</h3>
          </div>
          <span className="text-sm font-bold text-amber-400">
            {referralStats?.totalReferrals || 0}/10
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressTo48h}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-white/40 mt-2">
          {progressTo48h >= 100
            ? "🎉 Félicitations ! Tu as débloqué 48h VIP !"
            : `Invite encore ${10 - (referralStats?.totalReferrals || 0)} amis pour obtenir 48h VIP gratuit`}
        </p>
      </motion.div>

      {/* Partner Tier Progress */}
      {tierInfo.next && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-[#0a0d14] border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white">Prochain palier de commission</h3>
            </div>
            <span className="text-sm font-bold text-cyan-400">
              {(referralStats?.totalReferrals || 0)}/{tierInfo.next} filleuls
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${referralStats?.progressToNextTier || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">
            Passe à {tierInfo.next >= 16 ? 15 : 10}% en atteignant {tierInfo.next} filleuls
          </p>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-5"
        >
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-amber-400" />
            Ton lien de parrainage
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 truncate font-mono">{referralLink}</p>
            </div>
            <button
              onClick={copyLink}
              className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-amber-400" />}
            </button>
          </div>
          <Button
            onClick={() => setActiveTab("marketing")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            Voir les outils marketing <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-5"
        >
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-400" />
            Retrait
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Solde disponible</span>
              <span className="font-bold text-white">{balance?.available_balance?.toFixed(2) || "0.00"}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Minimum de retrait</span>
              <span className="font-bold text-white">30.00€</span>
            </div>
          </div>
          <Button
            onClick={() => setActiveTab("payouts")}
            disabled={!canRequestPayout || (balance?.available_balance || 0) < 30 || hasPendingPayout}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50"
          >
            {hasPendingPayout ? "Retrait en attente" : "Demander un retrait"}
          </Button>
          {!isPartnerActive && (
            <p className="text-[10px] text-amber-400 mt-2 text-center">
              Parraine 5 amis pour débloquer les commissions
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#0a0d14] border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Informations personnelles
        </h3>
        <p className="text-sm text-white/60 mb-6">
          Ces informations sont obligatoires pour pouvoir demander un retrait.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Pays</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Côte d'Ivoire"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Ville</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Numéro WhatsApp <span className="text-amber-400">*</span>
            </Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366]" />
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+225 07 XX XX XX XX"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <p className="text-[10px] text-white/40">Obligatoire pour la communication</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0a0d14] border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Méthode de paiement
        </h3>
        <p className="text-sm text-white/60 mb-6">
          Sélectionne ton opérateur mobile money pour recevoir tes paiements.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Opérateur</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Choisis ton opérateur" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0d14] border-white/10">
                {MOBILE_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-white">
                    <span className="flex items-center gap-2">
                      <span>{op.icon}</span>
                      <span>{op.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Numéro de téléphone</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+225 07 XX XX XX XX"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <p className="text-[10px] text-white/40">Format international avec indicatif pays</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSaveProfile}
        disabled={savingProfile || !fullName || !country || !city || !whatsappNumber || !operator || !phoneNumber}
        className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold"
      >
        {savingProfile ? "Enregistrement..." : "Enregistrer mon profil"}
      </Button>
    </div>
  );

  const renderPayouts = () => (
    <div className="space-y-6">
      {/* Request Payout Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-400" />
          Demander un retrait
        </h3>
        <p className="text-sm text-white/60 mb-4">
          Les retraits sont traités tous les Mardis. Minimum: 30€
        </p>

        {hasPendingPayout ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-white">Retrait en cours de traitement</p>
              <p className="text-xs text-white/60">Tu recevras ton paiement le prochain Mardi</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Montant à retirer (EUR)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="30"
                  max={balance?.available_balance || 30}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-32 bg-white/5 border-white/10 text-white"
                />
                <span className="text-sm text-white/60">
                  = {Math.round(parseFloat(payoutAmount || "0") * EUR_TO_FCFA).toLocaleString()} FCFA
                </span>
              </div>
              <p className="text-[10px] text-white/40">
                Solde disponible: {balance?.available_balance?.toFixed(2) || "0.00"}€
              </p>
            </div>

            {!partnerProfile && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Complète ton profil partenaire avant de demander un retrait.
                </p>
              </div>
            )}

            <Button
              onClick={handleRequestPayout}
              disabled={requesting || parseFloat(payoutAmount) < 30 || (balance?.available_balance || 0) < parseFloat(payoutAmount)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              {requesting ? "Envoi en cours..." : "Confirmer la demande"}
            </Button>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="rounded-2xl bg-[#0a0d14] border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Historique des retraits</h3>

        {payouts.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">Aucun retrait effectué</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  {payout.status === "pending" && <Clock className="h-5 w-5 text-amber-400" />}
                  {payout.status === "approved" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                  {payout.status === "rejected" && <XCircle className="h-5 w-5 text-red-400" />}
                  {payout.status === "paid" && <Banknote className="h-5 w-5 text-emerald-400" />}
                  <div>
                    <p className="text-sm font-bold text-white">{payout.amount.toFixed(2)}€</p>
                    <p className="text-[10px] text-white/40">
                      {Math.round(payout.amount_fcfa).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full",
                      payout.status === "pending" && "bg-amber-500/20 text-amber-400",
                      payout.status === "approved" && "bg-emerald-500/20 text-emerald-400",
                      payout.status === "rejected" && "bg-red-500/20 text-red-400",
                      payout.status === "paid" && "bg-emerald-500/20 text-emerald-400"
                    )}
                  >
                    {payout.status === "pending" && "En attente"}
                    {payout.status === "approved" && "Approuvé"}
                    {payout.status === "rejected" && "Rejeté"}
                    {payout.status === "paid" && "Payé"}
                  </span>
                  <p className="text-[10px] text-white/40 mt-1">
                    {format(parseISO(payout.requested_at), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCommissions = () => (
    <div className="rounded-2xl bg-[#0a0d14] border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Historique des commissions</h3>

      {commissions.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Aucune commission encore</p>
          <p className="text-[10px] text-white/30 mt-1">
            Commence à partager ton lien pour gagner des commissions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">
                    +{commission.commission_amount.toFixed(2)}€
                  </p>
                  <span className="text-[10px] text-white/40">
                    ({commission.commission_rate}% de {commission.subscription_amount.toFixed(2)}€)
                  </span>
                </div>
                <p className="text-[10px] text-white/40">
                  {commission.metadata?.is_renewal ? "Renouvellement" : "Nouvel abonnement"}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full",
                    commission.status === "pending" && "bg-amber-500/20 text-amber-400",
                    commission.status === "paid" && "bg-emerald-500/20 text-emerald-400",
                    commission.status === "cancelled" && "bg-red-500/20 text-red-400"
                  )}
                >
                  {commission.status === "pending" && "En attente"}
                  {commission.status === "paid" && "Payé"}
                  {commission.status === "cancelled" && "Annulé"}
                </span>
                <p className="text-[10px] text-white/40 mt-1">
                  {format(parseISO(commission.created_at), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Programme Partenaire - LiveFoot"
        description="Gagne de l'argent en parrainant tes amis sur LiveFoot. Jusqu'à 30% de commission sur chaque abonnement."
      />

      <div className="min-h-screen bg-[#06080c] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative z-10 pt-6 sm:pt-12 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </div>

          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-widest mb-4"
            >
              <Sparkles className="h-3 w-3" />
              Programme Partenaire
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-black text-white mb-2"
            >
              Gagne de l'argent avec{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                LiveFoot
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-white/60 max-w-lg mx-auto"
            >
              Parraine tes amis et gagne jusqu'à <strong className="text-amber-400">30%</strong> de commission
              sur chaque abonnement. Reçois tes gains chaque Mardi via Mobile Money.
            </motion.p>
          </div>

          {/* Commission Tiers Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-[#0a0d14] border border-white/10 p-4 mb-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-cyan-400 font-bold">10%</span>
                <span className="text-white/40">à 5 filleuls</span>
              </div>
              <span className="text-white/20">→</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-violet-400 font-bold">15%</span>
                <span className="text-white/40">à 16</span>
              </div>
              <span className="text-white/20">→</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-blue-400 font-bold">20%</span>
                <span className="text-white/40">à 31</span>
              </div>
              <span className="text-white/20">→</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-amber-400 font-bold">25%</span>
                <span className="text-white/40">à 51</span>
              </div>
              <span className="text-white/20">→</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-emerald-400 font-bold">30%</span>
                <span className="text-white/40">à 101+</span>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 bg-white/5 p-1 rounded-xl mb-6">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs sm:text-sm">
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs sm:text-sm">
                Profil
              </TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs sm:text-sm">
                Retraits
              </TabsTrigger>
              <TabsTrigger value="commissions" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs sm:text-sm">
                Commissions
              </TabsTrigger>
              <TabsTrigger value="marketing" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs sm:text-sm">
                Outils
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              {renderProfile()}
            </TabsContent>

            <TabsContent value="payouts" className="mt-0">
              {renderPayouts()}
            </TabsContent>

            <TabsContent value="commissions" className="mt-0">
              {renderCommissions()}
            </TabsContent>

            <TabsContent value="marketing" className="mt-0">
              <PartnerMarketing referralLink={referralLink} referralCode={referralCode} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
