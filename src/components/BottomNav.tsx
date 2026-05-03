import { Link, useLocation } from "react-router-dom";
import { Home, Star, Zap, Medal, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveFixtures } from "@/hooks/useApiFootball";

const navItems = [
  { href: "/", icon: Home, label: "Matchs" },
  { href: "/live", icon: Zap, label: "Live", isLive: true },
  { href: "/daily-picks", icon: Brain, label: "Pronos" },
  { href: "/rankings", icon: Medal, label: "Ranking" },
  { href: "/favorites", icon: Star, label: "Favoris" },
];

const BottomNav = () => {
  const location = useLocation();
  const { totalFavorites } = useFavorites();
  const { user } = useAuth();
  const { data: liveLeagues } = useLiveFixtures();

  const liveCount = liveLeagues?.reduce(
    (acc, l) => acc + l.matches.length,
    0
  ) || 0;

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-header border-t border-white/5 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-around h-14 sm:h-16 px-2">
        {navItems.map(({ href, icon: Icon, label, isLive }) => {
          const active = isActive(href);
          const isProfile = href === "/profile";
          const showAuthHint = isProfile && !user;
          const isFavoriteTab = href === "/favorites";

          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-all duration-200",
                active ? "text-primary" : "text-header-foreground/50 hover:text-header-foreground/80"
              )}
            >
               {active && (
                <motion.span 
                  layoutId="bottom-nav-active-dot"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-primary shadow-glow shadow-primary/50" 
                />
              )}

              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110",
                    isLive && !active && "text-live"
                  )}
                />

                {isLive && liveCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 rounded-full bg-live text-[8px] font-black text-white flex items-center justify-center px-0.5">
                    {liveCount}
                  </span>
                )}

                {isFavoriteTab && totalFavorites > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                    {totalFavorites > 9 ? "9+" : totalFavorites}
                  </span>
                )}

                {showAuthHint && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-muted-foreground/60" />
                )}
              </div>

              <span
                className={cn(
                  "text-[9px] font-medium leading-none",
                  active ? "text-primary" : isLive ? "text-live/70" : "text-header-foreground/50"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
