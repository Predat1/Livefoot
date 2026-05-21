import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Brain, Lock, Crown, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MatchAIChatProps {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  leagueName?: string;
  prediction?: any;
}

const SUGGESTED_QUESTIONS = [
  "Pourquoi tu préfères ce résultat ?",
  "Et si le gardien titulaire ne joue pas ?",
  "Quel est le meilleur pari sur ce match ?",
  "Quel est le risque principal ?",
];

export default function MatchAIChat({
  fixtureId, homeTeamName, awayTeamName, leagueName, prediction,
}: MatchAIChatProps) {
  const { isVip } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour ! Je suis l'IA AnalystePro V4. Posez-moi n'importe quelle question sur **${homeTeamName} vs ${awayTeamName}**. J'ai analysé toutes les données disponibles : forme, H2H, blessures, cotes et météo.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !isVip) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const predictionDetails = prediction ? [
        `Score prédit: ${prediction.predictedScore?.home ?? "?"}-${prediction.predictedScore?.away ?? "?"}`,
        `Confiance globale: ${prediction.confidence ?? "?"}%`,
        `xG domicile: ${prediction.xgHome ?? "N/A"}`,
        `xG extérieur: ${prediction.xgAway ?? "N/A"}`,
        `Meilleur pronostic: ${prediction.advice ?? "N/A"}`,
        prediction.valueBet ? `Value Bet repéré: ${prediction.valueBet}` : "",
      ].filter(Boolean).join(". ") : "";

      const context = `Contexte du match : ${homeTeamName} vs ${awayTeamName} (${leagueName || "Football"}). ` + 
        (prediction ? `Données IA : ${predictionDetails}. ` : `Aucune prédiction pré-calculée. `);

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          fixtureId,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          leagueName: leagueName || "Football",
          context,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          question: text,
        },
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data?.response || "Je n'ai pas pu analyser cette question. Réessayez.",
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Une erreur s'est produite. Veuillez réessayer dans quelques instants.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-950/60 to-[#0a0d14] border border-violet-500/20 hover:border-violet-500/40 hover:from-violet-950/80 hover:to-[#0c101a] transition-all group"
      >
        <div className="h-9 w-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:bg-violet-500/25 transition-colors">
          <MessageSquare className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-black text-white flex items-center gap-2">
            🧠 IA Conversationnelle
            {!isVip && <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black"><Crown className="h-2 w-2 inline" /> VIP</span>}
          </p>
          <p className="text-[10px] text-violet-300/50">Posez vos questions sur ce match</p>
        </div>
        <div className="text-violet-400/50 group-hover:text-violet-400 transition-colors text-sm font-bold">
          →
        </div>
      </button>

      {/* Chat modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-xl rounded-3xl border border-violet-500/30 bg-[#07090e] shadow-2xl shadow-violet-500/10 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/30 to-black/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-violet-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      AnalystePro V4
                      {!isVip && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5">
                          <Crown className="h-2.5 w-2.5" /> VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-violet-300/60">Analyse IA de {homeTeamName} vs {awayTeamName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="h-4 w-4 text-violet-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-500/20 border border-violet-500/30 text-white ml-auto"
                        : "bg-white/5 border border-white/10 text-white/80"
                    }`}>
                      {msg.content.split("**").map((part, j) =>
                        j % 2 === 1 ? <strong key={j} className="text-white font-bold">{part}</strong> : part
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                      <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex gap-1.5 items-center h-4">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400/50"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer / Input */}
              <div className="border-t border-white/5 bg-black/25">
                {/* Suggested questions */}
                {messages.length === 1 && isVip && (
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="text-[10px] text-violet-300 bg-violet-500/10 border border-violet-500/15 px-3 py-1.5 rounded-full hover:bg-violet-500/25 transition-all font-medium hover:scale-102 hover:border-violet-500/35">
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Non-VIP lock */}
                {!isVip && (
                  <div className="m-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">Fonctionnalité VIP</p>
                      <p className="text-[10px] text-white/40">Débloquez le chat IA sur tous les matchs pour poser vos questions à l'analyste.</p>
                    </div>
                    <Link to="/pricing" className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors shrink-0">
                      Devenir VIP
                    </Link>
                  </div>
                )}

                {/* Input form */}
                {isVip && (
                  <div className="p-4 flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                      placeholder={`Posez une question sur ${homeTeamName} vs ${awayTeamName}...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                      className="h-11 w-11 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center hover:bg-violet-500/30 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <Send className="h-4 w-4 text-violet-400" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
