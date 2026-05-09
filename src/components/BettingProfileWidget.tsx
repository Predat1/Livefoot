import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lock, Crown, Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PROFILES = [
  { id: "value_hunter", label: "Value Hunter", desc: "Je cherche les cotes sous-évaluées", emoji: "🔍" },
  { id: "btts", label: "BTTS Specialist", desc: "Je mise sur les 2 équipes qui marquent", emoji: "⚽" },
  { id: "safe", label: "Safe Bettor", desc: "Je préfère les faibles cotes sûres", emoji: "🛡️" },
  { id: "combo", label: "Combo Builder", desc: "Je construis des combinés", emoji: "🎰" },
  { id: "asian", label: "Asian Handicap", desc: "Je joue les handicaps asiatiques", emoji: "🎯" },
  { id: "live", label: "Live Trader", desc: "Je parie en cours de match", emoji: "⚡" },
];

const BANKROLL_LEVELS = [
  { id: "small", label: "< 100€", desc: "Mise unitaire : 5-10€" },
  { id: "medium", label: "100-500€", desc: "Mise unitaire : 20-50€" },
  { id: "large", label: "500-2000€", desc: "Mise unitaire : 50-200€" },
  { id: "pro", label: "> 2000€", desc: "Mise unitaire : 200€+" },
];

interface BettingProfile {
  profileType: string;
  bankroll: string;
}

export default function BettingProfileWidget() {
  const { isVip, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"profile" | "bankroll" | "done">("profile");
  const [selected, setSelected] = useState<BettingProfile>({ profileType: "", bankroll: "" });
  const [saved, setSaved] = useState<BettingProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !isVip) return;
    supabase
      .from("profiles")
      .select("betting_profile, bankroll_level")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.betting_profile) {
          setSaved({ profileType: data.betting_profile, bankroll: data.bankroll_level || "" });
          setSelected({ profileType: data.betting_profile, bankroll: data.bankroll_level || "" });
          setStep("done");
        }
      });
  }, [user, isVip]);

  const saveProfile = async () => {
    if (!user || !selected.profileType || !selected.bankroll) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ betting_profile: selected.profileType, bankroll_level: selected.bankroll } as any)
      .eq("id", user.id);
    setIsSaving(false);
    if (error) { toast.error("Erreur lors de la sauvegarde"); return; }
    setSaved(selected);
    setStep("done");
    setIsOpen(false);
    toast.success("Profil parieur sauvegardé !");
  };

  const currentProfile = PROFILES.find(p => p.id === (saved?.profileType || selected.profileType));

  return (
    <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-[#0a0d14] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => isVip && setIsOpen(v => !v)}
        className="w-full px-4 py-3 border-b border-amber-500/10 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Brain className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              🎯 Profil Parieur IA
              {!isVip && <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black"><Crown className="h-2 w-2 inline" /> VIP</span>}
            </h4>
            <p className="text-[9px] text-amber-400/50">
              {saved && currentProfile ? `Profil actif : ${currentProfile.emoji} ${currentProfile.label}` : "Personnalisez vos recommandations"}
            </p>
          </div>
        </div>
        {isVip && <ChevronRight className={`h-4 w-4 text-amber-400/50 transition-transform ${isOpen ? "rotate-90" : ""}`} />}
      </button>

      <AnimatePresence>
        {isOpen && isVip && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {step === "profile" && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-3">Votre style de jeu</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROFILES.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelected(s => ({ ...s, profileType: p.id })); setStep("bankroll"); }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selected.profileType === p.id
                            ? "bg-amber-500/20 border-amber-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="text-base mb-1">{p.emoji}</div>
                        <p className="text-xs font-bold text-white">{p.label}</p>
                        <p className="text-[9px] text-white/40">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "bankroll" && (
                <div>
                  <button onClick={() => setStep("profile")} className="text-[10px] text-white/40 mb-3 hover:text-white/60 flex items-center gap-1">
                    ← Retour
                  </button>
                  <p className="text-[10px] text-white/40 uppercase font-bold mb-3">Votre bankroll</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {BANKROLL_LEVELS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(s => ({ ...s, bankroll: b.id }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selected.bankroll === b.id
                            ? "bg-amber-500/20 border-amber-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <p className="text-xs font-black text-white">{b.label}</p>
                        <p className="text-[9px] text-white/40">{b.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={!selected.bankroll || isSaving}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-sm font-black hover:bg-amber-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isSaving ? "Sauvegarde..." : <><Check className="h-4 w-4" /> Sauvegarder mon profil</>}
                  </button>
                </div>
              )}

              {step === "done" && currentProfile && (
                <div className="text-center py-2">
                  <div className="text-3xl mb-2">{currentProfile.emoji}</div>
                  <p className="text-sm font-black text-white mb-1">{currentProfile.label}</p>
                  <p className="text-[10px] text-white/40 mb-3">{currentProfile.desc}</p>
                  <button
                    onClick={() => setStep("profile")}
                    className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors font-bold"
                  >
                    Modifier mon profil →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-VIP lock */}
      {!isVip && (
        <div className="p-4 flex items-center justify-between">
          <p className="text-[10px] text-white/30 flex-1">L'IA adapte ses recommandations à votre style</p>
          <Link to="/pricing" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-black hover:bg-amber-400 transition-colors shrink-0">
            <Lock className="h-3 w-3" /> Débloquer
          </Link>
        </div>
      )}
    </div>
  );
}
