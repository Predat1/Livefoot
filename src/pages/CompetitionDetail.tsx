import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHeadEnhanced";
import { SEOFAQSnippet } from "@/components/SEOFAQSnippet";
import { LLMOptimizedContent, getCompetitionFacts } from "@/components/LLMOptimizedContent";
import {
  useStandings,
  useTopScorers,
  useLeagueFixtures,
  TIER1_IDS,
} from "@/hooks/useApiFootball";
import { Trophy, TrendingUp, Calendar, ArrowLeft, Users, Target, MapPin } from "lucide-react";
import { cn } from "@lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Données enrichies SEO pour chaque compétition majeure
const COMPETITION_SEO_DATA: Record<string, {
  name: string;
  country: string;
  description: string;
  longDescription: string;
  founded: string;
  teams: number;
  currentChampion: string;
  mostSuccessful: string;
  keywords: string[];
  faqs: Array<{ q: string; a: string; keywords: string[] }>;
  funFacts: string[];
}> = {
  "61": { // Ligue 1
    name: "Ligue 1 Uber Eats",
    country: "France",
    description: "Le championnat de France de football de première division. Suivez le classement, les résultats et les meilleurs buteurs de la Ligue 1.",
    longDescription: "La Ligue 1 Uber Eats est le championnat professionnel de football de première division en France. Créée en 1932, elle réunit les 20 meilleures équipes françaises qui s'affrontent chaque saison pour décrocher le titre de Champion de France. Le Paris Saint-Germain est le club le plus titré de l'histoire récente avec de multiples championnats consécutifs.",
    founded: "1932",
    teams: 18,
    currentChampion: "Paris Saint-Germain",
    mostSuccessful: "Saint-Étienne (10 titres)",
    keywords: ["ligue 1", "championnat france", "football français", "psg", "om", "ol", "classement ligue 1", "meilleur buteur ligue 1"],
    faqs: [
      {
        q: "Quel est le classement actuel de la Ligue 1 ?",
        a: "Le classement de la Ligue 1 est mis à jour en temps réel sur LiveFoot.fun. Consultez les points, les matchs joués, les buts marqués et encaissés pour chaque équipe.",
        keywords: ["classement ligue 1", "tableau ligue 1", "points ligue 1"]
      },
      {
        q: "Qui est le meilleur buteur de la Ligue 1 cette saison ?",
        a: "Les statistiques des meilleurs buteurs de la Ligue 1 sont disponibles en direct sur notre page dédiée. Suivez l'évolution du classement des buteurs tout au long de la saison.",
        keywords: ["meilleur buteur ligue 1", "buteur", "stats buteurs"]
      },
      {
        q: "Quand se termine la saison de Ligue 1 ?",
        a: "La saison de Ligue 1 se déroule généralement d'août à mai, avec 34 journées de championnat. Les dates exactes varient chaque année en fonction du calendrier international.",
        keywords: ["calendrier ligue 1", "saison ligue 1", "journées"]
      },
      {
        q: "Quelles équipes sont qualifiées pour la Ligue des Champions ?",
        a: "Les 3 premières équipes du classement de Ligue 1 sont qualifiées pour la Ligue des Champions UEFA. La 4ème place qualifie pour la Ligue Europa.",
        keywords: ["qualification C1", "ligue des champions", "C1", "C3"]
      },
      {
        q: "Quelle est la règle des barrages en Ligue 1 ?",
        a: "À la fin de la saison, la 16ème de Ligue 1 dispute un barrage aller-retour contre la 3ème de Ligue 2 pour déterminer qui évoluera en Ligue 1 la saison suivante.",
        keywords: ["barrages ligue 1", "relégation", "promotion"]
      },
      {
        q: "Où regarder les matchs de Ligue 1 en streaming ?",
        a: "Les droits de diffusion de la Ligue 1 en France appartiennent à Amazon Prime Video (8 matchs par journée) et beIN SPORTS (2 matchs par journée). À l'international, les diffuseurs varient selon les pays.",
        keywords: ["streaming ligue 1", "diffusion", "télé"]
      }
    ],
    funFacts: [
      "La Ligue 1 est le 5ème championnat européen selon le coefficient UEFA",
      "Le PSG détient le record de titres consécutifs (2012-2023)",
      "Le record de buts sur une saison est détenu par Josip Skoblar (44 buts en 1970-71)",
      "L'AS Saint-Étienne est le club le plus titré avec 10 championnats"
    ]
  },
  "39": { // Premier League
    name: "Premier League",
    country: "Angleterre",
    description: "Le championnat anglais de football. Classement, résultats et statistiques de la Premier League.",
    longDescription: "La Premier League est le championnat professionnel de football de première division en Angleterre. Fondée en 1992, c'est considérée comme le championnat le plus compétitif et le plus regardé au monde. Manchester United domine l'histoire avec 13 titres depuis la création de la Premier League.",
    founded: "1992",
    teams: 20,
    currentChampion: "Manchester City",
    mostSuccessful: "Manchester United (13 titres PL)",
    keywords: ["premier league", "championnat anglais", "football anglais", "epl", "manchester united", "liverpool", "arsenal", "classement premier league"],
    faqs: [
      {
        q: "Qui mène le classement de la Premier League ?",
        a: "Le classement de la Premier League est mis à jour en temps réel. Suivez la course au titre entre Manchester City, Arsenal, Liverpool et les autres grands clubs anglais.",
        keywords: ["classement premier league", "tableau epl", "leader"]
      },
      {
        q: "Combien de matchs dans une saison de Premier League ?",
        a: "Une saison de Premier League compte 38 matchs par équipe (19 matchs à domicile, 19 à l'extérieur), soit 380 matchs au total pour la saison.",
        keywords: ["calendrier premier league", "matchs", "saison"]
      },
      {
        q: "Quelle est la règle de relégation en Premier League ?",
        a: "Les 3 derniers du classement (18ème, 19ème, 20ème) sont relégués en Championship (D2 anglaise). Les 2 premiers de Championship montent directement, plus un via les playoffs.",
        keywords: ["relégation premier league", "championship", "montée descente"]
      },
      {
        q: "Quelle équipe a gagné le plus de Premier League ?",
        a: "Manchester United détient le record avec 13 titres depuis la création de la Premier League en 1992. Manchester City suit avec 7 titres.",
        keywords: ["palmarès premier league", "titres", "record"]
      },
      {
        q: "Quand commence et finit la saison de Premier League ?",
        a: "La saison de Premier League débute généralement mi-août et se termine mi-mai. Il y a une pause hivernale en décembre-janvier.",
        keywords: ["dates premier league", "début saison", "fin saison"]
      },
      {
        q: "Qui diffuse la Premier League en France ?",
        a: "En France, les droits de la Premier League appartiennent à Canal+ qui diffuse tous les matchs en exclusivité sur ses chaînes et sa plateforme de streaming.",
        keywords: ["diffusion premier league", "streaming", "canal+"]
      }
    ],
    funFacts: [
      "La Premier League est diffusée dans 188 pays et atteint 4,7 milliards de téléspectateurs",
      "Le but le plus rapide a été marqué après 7,69 secondes (Shane Long, 2019)",
      "Alan Shearer détient le record de buts avec 260 buts",
      "Manchester City a marqué 100 buts lors de la saison 2017-18"
    ]
  },
  "140": { // La Liga
    name: "La Liga EA Sports",
    country: "Espagne",
    description: "Le championnat espagnol de football. Classement, résultats et stats de La Liga.",
    longDescription: "La Liga EA Sports est le championnat professionnel de football de première division en Espagne. Fondée en 1929, elle est dominée historiquement par le Real Madrid et le FC Barcelone. C'est l'un des championnats les plus techniques et spectaculaires d'Europe.",
    founded: "1929",
    teams: 20,
    currentChampion: "Real Madrid",
    mostSuccessful: "Real Madrid (35 titres)",
    keywords: ["la liga", "championnat espagnol", "football espagnol", "real madrid", "barça", "classement la liga"],
    faqs: [
      {
        q: "Qui est leader de La Liga ?",
        a: "Le classement de La Liga est mis à jour en temps réel. Suivez la rivalité entre Real Madrid et FC Barcelone pour le titre.",
        keywords: ["classement la liga", "leader", "tableau"]
      },
      {
        q: "Quand est le Clásico Real Madrid - Barcelone ?",
        a: "Les dates des Clásicos changent chaque saison. Consultez le calendrier complet de La Liga sur LiveFoot.fun pour connaître les prochaines dates.",
        keywords: ["clasico", "real madrid barcelone", "el clasico"]
      },
      {
        q: "Qui est le meilleur buteur de l'histoire de La Liga ?",
        a: "Lionel Messi détient le record avec 474 buts en La Liga, devant Cristiano Ronaldo (311 buts). En activité, Karim Benzema est le meilleur buteur.",
        keywords: ["meilleur buteur la liga", "record buts", "messi"]
      },
      {
        q: "Quelle est la différence entre La Liga et La Liga 2 ?",
        a: "La Liga EA Sports est la 1ère division espagnole (20 équipes). La Liga Hypermotion est la 2ème division avec 22 équipes.",
        keywords: ["la liga 2", "segunda division", "promotion"]
      },
      {
        q: "Comment fonctionne la qualification européenne en Espagne ?",
        a: "Top 4 Liga = Ligue des Champions, 5ème = Europa League, 6ème = Europa Conference League. Les vainqueurs de CDF et CDR peuvent aussi se qualifier.",
        keywords: ["qualification C1 espagne", "C1", "C3"]
      },
      {
        q: "Qui diffuse La Liga en France ?",
        a: "beIN SPORTS détient les droits de La Liga en France et diffuse les matchs en direct sur ses chaînes.",
        keywords: ["diffusion la liga", "bein", "streaming"]
      }
    ],
    funFacts: [
      "La Liga est le championnat le plus technique selon les statistiques de passes réussies",
      "Lionel Messi détient tous les records de buts et de passes décisives",
      "Le plus grand score de l'histoire est 12-1 (Athletic Bilbao vs Barça, 1931)",
      "Le Système de fair-play financier a été créé en Liga en 2013"
    ]
  },
  "135": { // Serie A
    name: "Serie A",
    country: "Italie",
    description: "Le championnat italien de football. Classement, résultats et stats de la Serie A.",
    longDescription: "La Serie A est le championnat professionnel de football de première division en Italie. Fondée en 1898, elle est célèbre pour son tactisme défensif et ses derbies intenses. La Juventus domine l'histoire avec 36 Scudetti.",
    founded: "1898",
    teams: 20,
    currentChampion: "Inter Milan",
    mostSuccessful: "Juventus (36 titres)",
    keywords: ["serie a", "championnat italien", "football italien", "juventus", "inter", "milan", "classement serie a"],
    faqs: [
      {
        q: "Quel est le classement de la Serie A ?",
        a: "Suivez le classement de la Serie A en temps réel avec les points, victoires, défaites et buts de toutes les équipes italiennes.",
        keywords: ["classement serie a", "tableau", "points"]
      },
      {
        q: "Quand est le Derby della Madonnina (Inter vs Milan) ?",
        a: "Les dates des derbys milanais varient chaque saison. Consultez le calendrier complet de Serie A pour les prochaines rencontres.",
        keywords: ["derby milan", "inter milan", "derby della madonnina"]
      },
      {
        q: "Qui est le meilleur buteur de l'histoire de la Serie A ?",
        a: "Silvio Piola détient le record historique avec 274 buts. En modernité, Francesco Totti est le 2ème avec 250 buts.",
        keywords: ["meilleur buteur serie a", "record", "piola"]
      },
      {
        q: "Combien de places qualificatives pour la C1 en Italie ?",
        a: "L'Italie a actuellement 4 places en Ligue des Champions (coefficient UEFA élevé), 1 en Europa League et 1 en Conference League.",
        keywords: ["places C1 italie", "qualification", "champions"]
      },
      {
        q: "Quelle est la particularité tactique de la Serie A ?",
        a: "La Serie A est réputée pour son tactisme défensif, les catenaccio et les montées en puissance après la trêve hivernale.",
        keywords: ["tactique serie a", "catenaccio", "defense"]
      },
      {
        q: "Qui diffuse la Serie A en France ?",
        a: "beIN SPORTS diffuse la Serie A en France, avec au moins 7 matchs par journée en direct.",
        keywords: ["diffusion serie a", "bein", "streaming"]
      }
    ],
    funFacts: [
      "La Juventus a remporté 9 titres consécutifs entre 2012 et 2020",
      "Le Calcio est le sport le plus populaire en Italie depuis 1898",
      "Gianluigi Buffon a joué plus de 900 matchs en Serie A",
      "Le San Siro est le plus grand stade d'Italie avec 80 000 places"
    ]
  },
  "78": { // Bundesliga
    name: "Bundesliga",
    country: "Allemagne",
    description: "Le championnat allemand de football. Classement et résultats de la Bundesliga.",
    longDescription: "La Bundesliga est le championnat professionnel de football de première division en Allemagne. Fondée en 1963, elle est connue pour ses stades pleins, son ambiance festive et son développement des jeunes talents. Le Bayern Munich domine l'ère moderne.",
    founded: "1963",
    teams: 18,
    currentChampion: "Bayer Leverkusen",
    mostSuccessful: "Bayern Munich (32 titres)",
    keywords: ["bundesliga", "championnat allemand", "football allemand", "bayern munich", "borussia", "classement bundesliga"],
    faqs: [
      {
        q: "Quel est le classement de la Bundesliga ?",
        a: "Suivez le classement de la Bundesliga en temps réel avec le Bayern Munich, le Borussia Dortmund, Bayer Leverkusen et toutes les équipes allemandes.",
        keywords: ["classement bundesliga", "tableau", "points"]
      },
      {
        q: "Quand a lieu la Winterpause en Bundesliga ?",
        a: "La Bundesliga observe une trêve hivernale (Winterpause) de fin décembre à fin janvier, généralement 4-5 semaines.",
        keywords: ["winterpause", "trêve hivernale", "calendrier bundesliga"]
      },
      {
        q: "Pourquoi la Bundesliga a-t-elle 18 équipes ?",
        a: "Contrairement aux autres grands championnats (20 équipes), la Bundesliga compte 18 clubs pour préserver la qualité et permettre une trêve hivernale.",
        keywords: ["18 équipes bundesliga", "format", "championnat"]
      },
      {
        q: "Quelle est la règle des barrages en Allemagne ?",
        a: "La 16ème de Bundesliga dispute des barrages aller-retour contre la 3ème de 2. Bundesliga pour la place en D1.",
        keywords: ["barrages bundesliga", "relegation", "2 bundesliga"]
      },
      {
        q: "Quel est le record de buts en Bundesliga ?",
        a: "Robert Lewandowski détient le record d'un seul auteur de buts sur une saison avec 41 buts en 2020-21, battant le record de Gerd Müller (40 buts).",
        keywords: ["record buts bundesliga", "lewandowski", "meilleur buteur"]
      },
      {
        q: "Qui diffuse la Bundesliga en France ?",
        a: "beIN SPORTS diffuse la Bundesliga en France avec des matchs en direct chaque weekend.",
        keywords: ["diffusion bundesliga", "bein", "streaming"]
      }
    ],
    funFacts: [
      "La Bundesliga a la meilleure affluence moyenne d'Europe (40 000 spectateurs/match)",
      "Le Bayern a remporté 11 titres consécutifs entre 2013 et 2023",
      "La 50+1 rule garantit que les fans conservent le contrôle majoritaire des clubs",
      "Lewandowski a marqué 5 buts en 9 minutes contre Wolfsburg en 2015"
    ]
  },
  "2": { // Champions League
    name: "UEFA Champions League",
    country: "Europe",
    description: "La Ligue des Champions UEFA. Calendrier, résultats et classement de la C1.",
    longDescription: "La Ligue des Champions est la compétition de clubs la plus prestigieuse d'Europe. Réunissant les meilleurs clubs de chaque championnat, elle culmine par une finale qui désigne le champion d'Europe. Le Real Madrid domine l'histoire avec 15 titres.",
    founded: "1955",
    teams: 32,
    currentChampion: "Real Madrid",
    mostSuccessful: "Real Madrid (15 titres)",
    keywords: ["ligue des champions", "champions league", "C1", "UEFA", "ldc", "real madrid", "calendrier C1"],
    faqs: [
      {
        q: "Quand commence la Ligue des Champions 2024-2025 ?",
        a: "La phase de groupes de la Ligue des Champions débute en septembre. Les matchs ont lieu les mardis et mercredis à 18h45 et 21h00.",
        keywords: ["calendrier C1", "dates ligue des champions", "début"]
      },
      {
        q: "Quel est le format de la nouvelle Ligue des Champions ?",
        a: "Depuis 2024-25, la C1 passe à 36 équipes en phase de league (8 matchs par équipe). Les 8 premiers sont qualifiés directement pour les 8èmes.",
        keywords: ["format C1", "nouvelle formule", "36 équipes"]
      },
      {
        q: "Qui a gagné le plus de Ligue des Champions ?",
        a: "Real Madrid détient le record absolu avec 15 titres, loin devant AC Milan (7) et Bayern Munich/Liverpool (6 chacun).",
        keywords: ["palmares C1", "titres", "real madrid record"]
      },
      {
        q: "Quelle équipe française a gagné la C1 ?",
        a: "L'Olympique de Marseille est le seul club français à avoir remporté la Ligue des Champions en 1993. Le PSG et Monaco ont atteint la finale.",
        keywords: ["om C1 1993", "france ligue des champions", "vainqueur français"]
      },
      {
        q: "Comment se qualifient les clubs pour la C1 ?",
        a: "Les champions des meilleurs championnats + les 2ème, 3ème, 4ème selon le coefficient UEFA du pays. Des barrages qualificatifs pour certains clubs.",
        keywords: ["qualification C1", "places", "coefficient"]
      },
      {
        q: "Qui diffuse la Ligue des Champions en France ?",
        a: "Canal+ et beIN SPORTS se partagent les droits en France. Canal+ diffuse le match du mercredi 21h, beIN les autres rencontres.",
        keywords: ["diffusion C1", "canal+", "bein", "télé"]
      }
    ],
    funFacts: [
      "Le Real Madrid a remporté les 5 premières éditions de la Coupe des Clubs Champions",
      "Cristiano Ronaldo est le meilleur buteur de l'histoire avec 140 buts",
      "La finale 2024 Real-MLV a été la 18ème finale du Real dans l'histoire",
      "Le nouveau format 2024-25 inclut 144 matchs de plus qu'avant"
    ]
  },
  "3": { // Europa League
    name: "UEFA Europa League",
    country: "Europe",
    description: "La Ligue Europa. Calendrier, résultats et classement de la C3.",
    longDescription: "La Ligue Europa est la deuxième compétition européenne de clubs. Ancienne Coupe UEFA, elle offre une autre voie d'accès vers la gloire européenne avec un trophée prestigieux et une qualification pour la Supercoupe et la C1.",
    founded: "1971",
    teams: 32,
    currentChampion: "Atalanta",
    mostSuccessful: "Séville (7 titres)",
    keywords: ["ligue europa", "europa league", "C3", "coupes d'europe", "calendrier C3"],
    faqs: [
      {
        q: "Quelle est la différence entre C1 et C3 ?",
        a: "La Ligue des Champions (C1) est la compétition elite avec les meilleurs clubs. La Ligue Europa (C3) est le 2nd niveau européen avec une phase de groupes différente.",
        keywords: ["difference C1 C3", "niveau europa", "classement"]
      },
      {
        q: "Comment se qualifier pour la Ligue Europa ?",
        a: "Via le championnat (5ème place généralement), la coupe nationale, ou en descendant de la phase de groupes de C1 (3èmes).",
        keywords: ["qualification europa", "places C3", "championnat"]
      },
      {
        q: "Qui a gagné le plus de Ligue Europa ?",
        a: "Séville détient le record avec 7 titres, souvent appelée le 'roi de la C3'. Suivent par Liverpool, Juventus et Inter (3 titres chacun).",
        keywords: ["palmares europa", "seville", "titres C3"]
      },
      {
        q: "La C3 donne-t-elle accès à la C1 ?",
        a: "Oui ! Le vainqueur de la Ligue Europa est qualifié pour la phase de groupes de la Ligue des Champions la saison suivante.",
        keywords: ["vainqueur europa C1", "qualification C1", "supercoupe"]
      },
      {
        q: "Quels jours se joue la Ligue Europa ?",
        a: "Les matchs de phase de groupes ont lieu les jeudis à 18h45 et 21h00. Les barrages et 8èmes sont aussi le jeudi.",
        keywords: ["jeudis europa", "horaires C3", "dates"]
      },
      {
        q: "Qui diffuse la Ligue Europa en France ?",
        a: "RMC Sport diffuse la Ligue Europa en France avec les matchs en direct chaque jeudi.",
        keywords: ["diffusion europa", "rmc sport", "télé C3"]
      }
    ],
    funFacts: [
      "Séville a remporté 7 finales sur 7 disputées en C3",
      "La C3 offre un billet pour la Supercoupe de l'UEFA face au vainqueur de la C1",
      "Le tournoi s'appelait Coupe UEFA jusqu'en 2009",
      "L'OM a remporté la Coupe UEFA en 2018 contre Salzbourg"
    ]
  }
};

const CompetitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const competitionId = id || "";
  
  const seoData = COMPETITION_SEO_DATA[competitionId];
  const isMajorCompetition = !!seoData;

  // Récupération des données
  const { data: standings, isLoading: loadingStandings } = useStandings(competitionId);
  const { data: topScorers, isLoading: loadingScorers } = useTopScorers(competitionId);
  const { data: fixtures, isLoading: loadingFixtures } = useLeagueFixtures(competitionId);

  // SEO Data
  const title = seoData 
    ? `${seoData.name} ${new Date().getFullYear()}-${new Date().getFullYear() + 1} | Classement, Résultats & Stats`
    : `Compétition ${competitionId} | LiveFoot.fun`;
  
  const description = seoData?.description || `Suivez les résultats, le classement et les statistiques de la compétition.`;

  // Breadcrumbs
  const breadcrumbs = [
    { name: "Accueil", url: "/" },
    { name: "Compétitions", url: "/competitions" },
    { name: seoData?.name || "Détail", url: `/competitions/${competitionId}` },
  ];

  if (!isMajorCompetition) {
    return (
      <Layout>
        <SEOHead title={title} description={description} breadcrumbs={breadcrumbs} />
        <div className="container py-8">
          <Link to="/competitions" className="text-primary hover:underline">← Retour aux compétitions</Link>
          <h1 className="text-2xl font-bold mt-4">Compétition</h1>
          <p className="text-muted-foreground">Données en cours de chargement...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        keywords={seoData.keywords.join(", ")}
        breadcrumbs={breadcrumbs}
        canonical={`https://www.livefoot.fun/competitions/${competitionId}`}
      />

      <div className="container py-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/competitions" className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux compétitions
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Trophy className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{seoData.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {seoData.country} • Fondée en {seoData.founded}
              </p>
            </div>
            {TIER1_IDS.has(competitionId) && (
              <Badge className="md:ml-auto bg-primary/20 text-primary">Compétition Elite</Badge>
            )}
          </div>
        </div>

        {/* Description SEO */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">{seoData.longDescription}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted rounded-lg p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{seoData.teams}</p>
                <p className="text-sm text-muted-foreground">Équipes</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold">{seoData.currentChampion}</p>
                <p className="text-sm text-muted-foreground">Champion actuel</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold">{seoData.mostSuccessful}</p>
                <p className="text-sm text-muted-foreground">Plus titré</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
                <p className="text-sm text-muted-foreground">Saison</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs avec données */}
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="standings">Classement</TabsTrigger>
            <TabsTrigger value="scorers">Buteurs</TabsTrigger>
            <TabsTrigger value="fixtures">Matchs</TabsTrigger>
            <TabsTrigger value="facts">Fun Facts</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Classement {seoData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStandings ? (
                  <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : standings && standings.length > 0 ? (
                  <div className="space-y-2">
                    {standings.slice(0, 10).map((team, index) => (
                      <div key={team.team.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <span className="w-8 text-center font-bold">{index + 1}</span>
                        <img src={team.team.logo} alt={team.team.name} className="w-8 h-8 object-contain" />
                        <span className="flex-1 font-medium">{team.team.name}</span>
                        <span className="text-muted-foreground">{team.points} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Classement non disponible</p>
                )}
                
                <Link 
                  to={`/standings?league=${competitionId}`}
                  className="mt-4 text-primary hover:underline flex items-center gap-2"
                >
                  Voir le classement complet <TrendingUp className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Meilleurs Buteurs</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingScorers ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topScorers && topScorers.length > 0 ? (
                  <div className="space-y-2">
                    {topScorers.slice(0, 5).map((scorer, index) => (
                      <div key={scorer.player.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <span className="w-8 text-center font-bold">{index + 1}</span>
                        <span className="flex-1 font-medium">{scorer.player.name}</span>
                        <span className="text-muted-foreground">{scorer.statistics[0]?.goals.total || 0} buts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Statistiques non disponibles</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixtures" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Prochains Matchs</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFixtures ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : fixtures && fixtures.length > 0 ? (
                  <div className="space-y-2">
                    {fixtures.slice(0, 5).map((match) => (
                      <Link
                        key={match.fixture?.id}
                        to={`/match/${match.fixture?.id}`}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img src={match.teams?.home?.logo || ""} alt="" className="w-6 h-6 object-contain" />
                          <span className="font-medium">{match.teams?.home?.name || "Domicile"}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">VS</span>
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-medium">{match.teams?.away?.name || "Extérieur"}</span>
                          <img src={match.teams?.away?.logo || ""} alt="" className="w-6 h-6 object-contain" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun match programmé</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Fun Facts - {seoData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {seoData.funFacts.map((fact, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-primary font-bold">{index + 1}.</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* LLM Optimized Content - Pour citations IA */}
        <LLMOptimizedContent
          facts={getCompetitionFacts(
            seoData.name,
            seoData.country,
            seoData.founded,
            seoData.currentChampion,
            seoData.mostSuccessful
          )}
          entityType="competition"
          entityName={seoData.name}
          title={`À propos de ${seoData.name}`}
        />

        {/* FAQ SEO Section */}
        <SEOFAQSnippet
          faqs={seoData.faqs.map(faq => ({
            question: faq.q,
            answer: faq.a,
            keywords: faq.keywords,
            isFeatured: true
          }))}
          title="Questions fréquentes sur la"
          topic={seoData.name}
        />

        {/* Internal Linking */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle>Explorez aussi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/live" className="p-4 bg-card rounded-lg hover:bg-accent transition-colors text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-medium">Scores Live</p>
                <p className="text-xs text-muted-foreground">Matchs en direct</p>
              </Link>
              <Link to="/daily-picks" className="p-4 bg-card rounded-lg hover:bg-accent transition-colors text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-medium">Pronostics IA</p>
                <p className="text-xs text-muted-foreground">88% de réussite</p>
              </Link>
              <Link to="/standings" className="p-4 bg-card rounded-lg hover:bg-accent transition-colors text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-medium">Classements</p>
                <p className="text-xs text-muted-foreground">Toutes les ligues</p>
              </Link>
              <Link to="/news" className="p-4 bg-card rounded-lg hover:bg-accent transition-colors text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="font-medium">Actualités</p>
                <p className="text-xs text-muted-foreground">News football</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CompetitionDetail;
