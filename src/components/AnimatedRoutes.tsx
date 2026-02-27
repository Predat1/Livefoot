import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import PageTransition from "./PageTransition";

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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />} key={location.pathname}>
        <Routes location={location} key={location.pathname}>
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
          <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
          <Route path="/explorer" element={<PageTransition><Explorer /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
