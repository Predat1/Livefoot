import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Check, Share2, MessageCircle, Facebook, Twitter, Video, Lightbulb, HelpCircle, Target, Clock, Hash, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PartnerMarketingProps {
  referralLink: string;
  referralCode: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  content: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "whatsapp-short",
    name: "WhatsApp Court",
    icon: <MessageCircle className="h-4 w-4 text-[#25D366]" />,
    content: `🏆 *Tu veux des pronostics football gagnants ?*

J'utilise LiveFoot AI, une appli avec des analyses IA ultra-précises. 

Rejoins-moi avec mon lien et on gagne ensemble 👇

{REFERRAL_LINK}

C'est gratuit à l'inscription ! 🔥`
  },
  {
    id: "whatsapp-long",
    name: "WhatsApp Long",
    icon: <MessageCircle className="h-4 w-4 text-[#25D366]" />,
    content: `🏆 *Amateur de football et de paris sportifs ?*

Je viens de découvrir une appli INCROYABLE : *LiveFoot AI*

Ce qu'elle fait :
✅ Pronostics IA sur 800+ compétitions
✅ Value bets détectés automatiquement
✅ Analyses H2H détaillées
✅ Alertes en temps réel

Les résultats sont impressionnants. L'IA prédit avec une précision folle.

*Bonus exclusif* : Si tu t'inscris avec mon lien, on peut tous les deux bénéficier de l'accès VIP !

👉 {REFERRAL_LINK}

Teste gratuitement et dis-moi ce que tu en penses 👀`
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <MessageCircle className="h-4 w-4 text-[#229ED9]" />,
    content: `🏆 Les meilleurs pronostics foot par IA

Salut ! Tu cherches des analyses fiables pour tes paris ?

J'utilise LiveFoot AI — un algo qui scanne 800+ compétitions et détecte les Value Bets.

Rejoins avec mon lien : {REFERRAL_LINK}

Gratuit à l'inscription. On se retrouve dessus ! ⚽️`
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-4 w-4 text-[#1877F2]" />,
    content: `🏆 Découvre LiveFoot AI — l'appli qui révolutionne les pronostics football !

Tu en as marre de perdre tes paris ? Moi aussi, jusqu'à ce que je trouve cette appli.

L'IA analyse :
• 800+ compétitions mondiales
• Les cotes en temps réel
• Les value bets cachés
• Les stats H2H détaillées

Résultat ? Des pronostics beaucoup plus fiables.

Inscris-toi gratuitement avec mon lien 👇
{REFERRAL_LINK}

#PronosticsFoot #LiveFootAI #ParisSportifs #Football`
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: <Twitter className="h-4 w-4 text-white" />,
    content: `🏆 Enfin des pronostics foot qui gagnent !

Je teste @LiveFootAI depuis 2 semaines et c'est impressionnant :
• IA AnalystePro V4
• Value bets auto
• 800+ compétitions

Rejoins avec mon lien et on progresse ensemble 👇
{REFERRAL_LINK}

#TeamParieur #Pronostics #Football`
  },
  {
    id: "tiktok",
    name: "TikTok / Reels",
    icon: <Video className="h-4 w-4 text-white" />,
    content: `Tu perds tes paris foot ? 😰

J'ai la SOLUTION 👇

LiveFoot AI — une appli avec une IA de FOU qui :
✨ Prédit les scores
✨ Détecte les value bets
✨ Analyse 800+ compétitions

Inscris-toi avec mon lien en bio et on gagne ensemble 🚀

#pourtoi #pronostics #football #betting #fyp`
  }
];

const PITCH_SCRIPTS = [
  {
    id: "pitch-30s",
    name: "Pitch 30 secondes",
    content: `Tu connais LiveFoot AI ? C'est une appli qui utilise l'intelligence artificielle pour faire des pronostics foot ultra-précis. Elle analyse 800 compétitions, détecte les value bets, et donne des prédictions sur scores exacts. Inscris-toi avec mon lien, c'est gratuit et on peut même débloquer l'accès VIP ensemble !`
  },
  {
    id: "pitch-2min",
    name: "Pitch 2 minutes",
    content: `Tu sais, j'en ai marre de perdre mes paris au hasard. Du coup j'ai cherché un truc plus fiable et j'ai trouvé LiveFoot AI. C'est une appli qui utilise l'IA — genre vraiment de l'intelligence artificielle puissante — pour analyser les matchs. 

Elle regarde tout : les stats des équipes, les confrontations directes, les formes actuelles, les cotes des bookmakers... Et elle te donne des pronostics avec un taux de confiance. 

Ce qui est ouf c'est qu'elle détecte aussi les "value bets" — c'est quand une cote est plus élevée que la probabilité réelle de l'événement. C'est là que tu gagnes le plus d'argent.

Y'a 800 compétitions couvertes, des gros championnats aux petites ligues. Tu peux même chatter avec l'IA pour qu'elle t'explique pourquoi elle pense qu'un tel résultat va arriver.

Inscris-toi avec mon lien, c'est gratuit à l'inscription. Et si on est assez à rejoindre, on débloque tous les accès VIP. Teste et dis-moi !`
  }
];

const FAQ_RESPONSES = [
  {
    question: "C'est gratuit ?",
    answer: `Oui, totalement gratuit à l'inscription ! Tu as accès à plein de fonctionnalités gratuites. Et si tu veux plus de puissance (pronostics Score Exact, Value Bets illimités), tu peux passer VIP. Mais déjà, teste gratuitement et tu verras la qualité.`
  },
  {
    question: "C'est fiable l'IA ?",
    answer: `L'IA utilise des modèles mathématiques avancés (modèle Double Poisson, ELO, etc.) et analyse des millions de données. Évidemment, personne ne gagne à 100% — c'est impossible dans le foot. Mais l'IA te donne la probabilité réelle, ce qui te permet de prendre des décisions éclairées. C'est bien mieux que le hasard !`
  },
  {
    question: "Je connais déjà les autres sites de pronostics",
    answer: `C'est justement ce qui change ! LiveFoot c'est pas des humains qui donnent des avis. C'est une IA qui analyse objectivement les données. Pas de biais, pas d'émotion, juste des maths. Et elle apprend de ses erreurs pour s'améliorer. Teste, compare, et tu verras la différence.`
  },
  {
    question: "J'ai peur de perdre de l'argent",
    answer: `C'est normal et c'est pour ça qu'il faut être prudent. L'appli donne des probabilités, pas des certitudes. Ne parie jamais plus que ce tu peux perdre. L'objectif c'est de gagner sur le long terme en misant sur les value bets — c'est comme ça que les pros font. Et LiveFoot t'aide justement à repérer ces opportunités.`
  },
  {
    question: "Ça marche sur téléphone ?",
    answer: `Oui, c'est une PWA — tu l'installe direct depuis le navigateur et ça fait comme une vraie appli. Disponible sur iPhone et Android. Tu reçois même des notifications push pour les buts et les alertes value bet.`
  }
];

const TIPS = [
  {
    icon: <Clock className="h-5 w-5 text-amber-400" />,
    title: "Meilleurs moments pour poster",
    content: "Poste le vendredi soir (avant le weekend de matchs) ou le samedi matin. Les gens planifient leurs paris pour le weekend. Évite le dimanche soir quand les matchs sont finis."
  },
  {
    icon: <Users className="h-5 w-5 text-cyan-400" />,
    title: "Où partager ton lien",
    content: "Groupes WhatsApp de passionnés de foot, communautés Telegram de parieurs, groupes Facebook sur les paris sportifs, commentaires sur les posts foot des influenceurs, forums de discussion sportive."
  },
  {
    icon: <Hash className="h-5 w-5 text-violet-400" />,
    title: "Hashtags qui fonctionnent",
    content: "#TeamParieur #Pronostics #PronoFoot #ParisSportifs #BettingTips #Football #Ligue1 #PremierLeague #ValueBet #LiveFootAI"
  },
  {
    icon: <Target className="h-5 w-5 text-emerald-400" />,
    title: "Stratégie gagnante",
    content: "Ne spam pas ! Partage ton lien 1-2 fois par jour max. Mieux vaut des messages personnalisés à quelques personnes qu'un spam à tout le monde. Montre des résultats concrets (screenshots de pronostics gagnants)."
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    title: "Le pouvoir du témoignage",
    content: "Quand tu as un prono qui passe, fais un screenshot et partage-le ! Rien ne convertit mieux qu'une preuve sociale. Montre tes gains (même petits) pour inspirer confiance."
  }
];

export default function PartnerMarketing({ referralLink, referralCode }: PartnerMarketingProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text.replace("{REFERRAL_LINK}", referralLink));
    setCopiedId(id);
    toast.success("Texte copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const replaceVariables = (text: string) => {
    return text.replace(/{REFERRAL_LINK}/g, referralLink).replace(/{REFERRAL_CODE}/g, referralCode);
  };

  return (
    <div className="space-y-6">
      {/* Quick Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-amber-400" />
          Ton lien de parrainage
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/60 font-mono truncate">{referralLink}</p>
          </div>
          <button
            onClick={() => copyToClipboard(referralLink, "main-link")}
            className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
          >
            {copiedId === "main-link" ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-amber-400" />}
          </button>
        </div>
        <p className="text-[10px] text-white/40 mt-3">
          Partage ce lien partout. Chaque inscription compte pour ton programme partenaire.
        </p>
      </motion.div>

      {/* Templates Tabs */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-white/5 p-1 rounded-xl">
          <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs">
            Messages
          </TabsTrigger>
          <TabsTrigger value="scripts" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs">
            Scripts
          </TabsTrigger>
          <TabsTrigger value="faq" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs">
            FAQ
          </TabsTrigger>
          <TabsTrigger value="tips" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 text-xs">
            Astuces
          </TabsTrigger>
        </TabsList>

        {/* Message Templates */}
        <TabsContent value="messages" className="mt-4 space-y-4">
          {MESSAGE_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl bg-[#0a0d14] border border-white/10 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {template.icon}
                  <span className="text-sm font-bold text-white">{template.name}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(replaceVariables(template.content), template.id)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors",
                    copiedId === template.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  {copiedId === template.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === template.id ? "Copié !" : "Copier"}
                </button>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                <p className="text-xs text-white/60 whitespace-pre-line font-mono leading-relaxed">
                  {replaceVariables(template.content)}
                </p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* Pitch Scripts */}
        <TabsContent value="scripts" className="mt-4 space-y-4">
          {PITCH_SCRIPTS.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl bg-[#0a0d14] border border-white/10 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{script.name}</span>
                <button
                  onClick={() => copyToClipboard(replaceVariables(script.content), script.id)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors",
                    copiedId === script.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  {copiedId === script.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === script.id ? "Copié !" : "Copier"}
                </button>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                <p className="text-xs text-white/60 leading-relaxed">
                  {replaceVariables(script.content)}
                </p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* FAQ Responses */}
        <TabsContent value="faq" className="mt-4">
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_RESPONSES.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem value={`item-${index}`} className="border border-white/10 rounded-2xl bg-[#0a0d14] px-4">
                  <AccordionTrigger className="text-sm font-bold text-white py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-400" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-white/60 pb-4 whitespace-pre-line leading-relaxed">
                    {replaceVariables(faq.answer)}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </TabsContent>

        {/* Tips */}
        <TabsContent value="tips" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-[#0a0d14] border border-white/10 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {tip.icon}
                  <span className="text-sm font-bold text-white">{tip.title}</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {tip.content}
                </p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reminder Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1">💡 Conseil pro</h4>
            <p className="text-xs text-white/60">
              La confiance est la clé. Ne promets pas de gains miracles — explique plutôt comment 
              l'IA aide à prendre de meilleures décisions. Les gens qui comprennent la valeur resteront 
              et s'abonneront. Un filleul actif vaut mieux que 10 inscrits inactifs !
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
