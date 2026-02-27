import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eager: core pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: secondary pages
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Competitions = lazy(() => import("./pages/Competitions"));
const Teams = lazy(() => import("./pages/Teams"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const Players = lazy(() => import("./pages/Players"));
const PlayerDetail = lazy(() => import("./pages/PlayerDetail"));
const Transfers = lazy(() => import("./pages/Transfers"));
const Match = lazy(() => import("./pages/Match"));
const Live = lazy(() => import("./pages/Live"));
const Install = lazy(() => import("./pages/Install"));
const Standings = lazy(() => import("./pages/Standings"));
const Favorites = lazy(() => import("./pages/Favorites"));
const SearchPage = lazy(() => import("./pages/Search"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Rankings = lazy(() => import("./pages/Rankings"));
const PredictionsDashboard = lazy(() => import("./pages/PredictionsDashboard"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000, // keep unused data 30min (Explorer benefits)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/live" element={<Live />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:newsId" element={<NewsDetail />} />
                <Route path="/competitions" element={<Competitions />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:teamId" element={<TeamDetail />} />
                <Route path="/players" element={<Players />} />
                <Route path="/players/:playerId" element={<PlayerDetail />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/match/:matchId" element={<Match />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/predictions" element={<PredictionsDashboard />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/install" element={<Install />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
