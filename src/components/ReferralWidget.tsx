import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Check, Crown, Zap, Gift, ChevronRight, Share2, Banknote, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REFERRAL_GOAL = 10;

function generateCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    const seed = userId.charCodeAt(i % userId.length) + i * 7;
    code += chars[seed % chars.length];
  }
  return code;
}

export default function ReferralWidget() {
  const { user, profile, refreshProfile } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    initReferral();
  }, [user]);

  const initReferral = async () => {
    if (!user) return;
    setLoading(true);

    // Récupérer ou créer le code parrain
    const { data: p } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", user.id)
      .maybeSingle();

    let code = (p as any)?.referral_code;
    if (!code) {
      code = generateCode(user.id);
      await supabase
        .from("profiles")
        .update({ referral_code: code } as any)
        .eq("user_id", user.id);
    }
    setReferralCode(code);

    // Compter les parrainages
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);
    setReferralCount(count ?? 0);
    setLoading(false);
  };

  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🏆 Rejoins-moi sur LiveFoot AI — les meilleurs pronostics IA pour le football ! Utilise mon lien pour t'inscrire : ${referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareTelegram = () => {
    const msg = encodeURIComponent(`🏆 Rejoins LiveFoot AI avec mon lien : ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`, "_blank");
  };

  const isGoalReached = referralCount >= REFERRAL_GOAL;
  const progressPct = Math.min(100, (referralCount / REFERRAL_GOAL) * 100);
  const vipGrantedAt = (profile as any)?.referral_vip_granted_at;
  const vipExpires = (profile as any)?.vip_expires_at;

  // Partner tier info
  const isPartnerActive = referralCount >= 5;
  const commissionRate = referralCount >= 101 ? 30 :
                         referralCount >= 51 ? 25 :
                         referralCount >= 31 ? 20 :
                         referralCount >= 16 ? 15 :
                         referralCount >= 5 ? 10 : 0;
  const progressToPartner = Math.min(100, (referralCount / 5) * 100);
  const nextTier = referralCount >= 101 ? null :
                   referralCount >= 51 ? 101 :
                   referralCount >= 31 ? 51 :
                   referralCount >= 16 ? 31 :
                   referralCount >= 5 ? 16 : 5;

  if (!user) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-[#0a0d14] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-amber-500/10 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Gift className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            Parrainez 10 amis — Obtenez 48h VIP
            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">GRATUIT</span>
          </h3>
          <p className="text-[10px] text-white/40">Chaque ami inscrit via votre lien compte</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-black text-white">
                {loading ? "..." : `${referralCount} / ${REFERRAL_GOAL}`}
              </span>
              <span className="text-xs text-white/40">amis invités</span>
            </div>
            {isGoalReached && vipGrantedAt ? (
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Crown className="h-3 w-3" /> VIP ACTIVÉ
              </span>
            ) : (
              <span className="text-[10px] text-white/30 font-bold">
                {Math.max(0, REFERRAL_GOAL - referralCount)} restants
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <motion.div
              className={`h-full rounded-full ${isGoalReached ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-amber-600 to-amber-400"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Milestones */}
          <div className="flex justify-between mt-1.5 px-0.5">
            {[0, 5, 10].map(n => (
              <div key={n} className="flex flex-col items-center gap-0.5">
                <div className={`h-1.5 w-1.5 rounded-full ${referralCount >= n ? "bg-amber-400" : "bg-white/10"}`} />
                <span className="text-[8px] text-white/20">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Partner badge if active */}
        {isPartnerActive && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20"
          >
            <Banknote className="h-5 w-5 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-black text-white flex items-center gap-2">
                💰 Partenaire Actif — {commissionRate}% de commission
                <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                  GAGNE DE L'ARGENT
                </span>
              </p>
              <p className="text-[10px] text-cyan-400/70">
                {nextTier ? `Passe à ${commissionRate >= 15 ? 20 : commissionRate >= 10 ? 15 : 10}% à ${nextTier} filleuls` : "Tu es au niveau maximum ! 🎉"}
              </p>
            </div>
            <Link
              to="/partner"
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Voir <ArrowUpRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        {/* Progress to partner tier (if not yet active) */}
        {!isPartnerActive && referralCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white">Progrès vers le Programme Partenaire</p>
              <span className="text-[10px] text-cyan-400">{referralCount}/5 filleuls</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToPartner}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2">
              Atteins 5 filleuls pour débloquer les commissions (10%)
            </p>
          </motion.div>
        )}

        {/* VIP countdown if active */}
        {isGoalReached && vipExpires && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <Zap className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">48h VIP débloqué !</p>
              <p className="text-[10px] text-emerald-400/70">
                Expire le {new Date(vipExpires).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </motion.div>
        )}

        {/* Referral link */}
        <div>
          <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Votre lien d'invitation</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
              <span className="text-[11px] text-white/60 truncate flex-1 font-mono">
                {loading ? "Chargement..." : referralLink}
              </span>
            </div>
            <button
              onClick={copyLink}
              disabled={!referralCode}
              className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/25 transition-colors shrink-0 disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <button
            onClick={shareWhatsApp}
            disabled={!referralCode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-colors disabled:opacity-40"
          >
            <Share2 className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button
            onClick={shareTelegram}
            disabled={!referralCode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-xs font-bold hover:bg-[#229ED9]/20 transition-colors disabled:opacity-40"
          >
            <Share2 className="h-3.5 w-3.5" /> Telegram
          </button>
          <button
            onClick={copyLink}
            disabled={!referralCode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" /> Copier
          </button>
        </div>

        {/* CTA payant ou partenaire */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          {isPartnerActive ? (
            <>
              <p className="text-[10px] text-white/30">Accède à tes gains et outils marketing</p>
              <Link
                to="/partner"
                className="flex items-center gap-1 text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Banknote className="h-3 w-3" /> Espace Partenaire <ChevronRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-[10px] text-white/30">Vous préférez un accès permanent ?</p>
              <Link
                to="/pricing"
                className="flex items-center gap-1 text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Crown className="h-3 w-3" /> Abonnement VIP <ChevronRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
