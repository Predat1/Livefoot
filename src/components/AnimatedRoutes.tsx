import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import BrandedLoader from "./BrandedLoader";
import PageTransition from "./PageTransition";
import ErrorBoundary from "./ErrorBoundary";

// Eager: core pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Lazy: secondary pages
const News = lazy(() => import("@/pages/News"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
const Competitions = lazy(() => import("@/pages/Competitions"));
const Teams = lazy(() => import("@/pages/Teams"));
const TeamDetail = lazy(() => import("@/pages/TeamDetail"));
const Players = lazy(() => import("@/pages/Players"));
const PlayerDetail = lazy(() => import("@/pages/PlayerDetail"));
const Transfers = lazy(() => import("@/pages/Transfers"));
const Match = lazy(() => import("@/pages/Match"));
const Live = lazy(() => import("@/pages/Live"));
const Install = lazy(() => import("@/pages/Install"));
const Standings = lazy(() => import("@/pages/Standings"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const SearchPage = lazy(() => import("@/pages/Search"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Auth = lazy(() => import("@/pages/Auth"));
const Profile = lazy(() => import("@/pages/Profile"));
const Rankings = lazy(() => import("@/pages/Rankings"));
const PredictionsDashboard = lazy(() => import("@/pages/PredictionsDashboard"));
const Explorer = lazy(() => import("@/pages/Explorer"));
const Admin = lazy(() => import("@/pages/Admin"));
const DynamicSitemap = lazy(() => import("@/pages/DynamicSitemap"));
const DailyPicks = lazy(() => import("@/pages/DailyPicks"));
const Bonuses = lazy(() => import("@/pages/Bonuses"));
const Pricing = lazy(() => import("@/pages/Pricing"));

const PageLoader = () => <BrandedLoader variant="page" message="Chargement..." />;

// Fallback affiché si un lazy chunk ne se charge pas (réseau coupé, 404 CDN)
const RouteErrorFallback = () => (
  <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
    <div className="text-5xl">⚽</div>
    <h2 className="text-xl font-bold">Page temporairement indisponible</h2>
    <p className="text-slate-400 text-sm max-w-sm">
      Impossible de charger cette page. Vérifiez votre connexion et réessayez.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-2 bg-emerald-500 rounded-lg font-bold hover:bg-emerald-600 transition-colors text-sm"
    >
      Recharger
    </button>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    // ✅ FIX: key sur AnimatePresence uniquement, pas sur Suspense
    // Suspense reste stable et ne se démonte pas à chaque navigation
    <AnimatePresence mode="wait">
      <ErrorBoundary fallback={<RouteErrorFallback />} key={location.pathname}>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<PageTransition><Index /></PageTransition>} />
            <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
            <Route path="/live" element={<PageTransition><Live /></PageTransition>} />
            <Route path="/news" element={<PageTransition><News /></PageTransition>} />
            <Route path="/news/:newsId" element={<PageTransition><NewsDetail /></PageTransition>} />
            <Route path="/competitions" element={<PageTransition><Competitions /></PageTransition>} />
            <Route path="/standings" element={<PageTransition><Standings /></PageTransition>} />
            <Route path="/teams" element={<PageTransition><Teams /></PageTransition>} />
            <Route path="/teams/:teamId" element={<PageTransition><TeamDetail /></PageTransition>} />
            <Route path="/players" element={<PageTransition><Players /></PageTransition>} />
            <Route path="/players/:playerId" element={<PageTransition><PlayerDetail /></PageTransition>} />
            <Route path="/rankings" element={<PageTransition><Rankings /></PageTransition>} />
            <Route path="/transfers" element={<PageTransition><Transfers /></PageTransition>} />
            <Route path="/match/:matchId" element={<PageTransition><Match /></PageTransition>} />
            <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="/predictions" element={<PageTransition><PredictionsDashboard /></PageTransition>} />
            <Route path="/daily-picks" element={<PageTransition><DailyPicks /></PageTransition>} />
            <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
            <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
            <Route path="/explorer" element={<PageTransition><Explorer /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
            <Route path="/bonuses" element={<PageTransition><Bonuses /></PageTransition>} />
            <Route path="/dynamic-sitemap.xml" element={<DynamicSitemap />} />
            <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
