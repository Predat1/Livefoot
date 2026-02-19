import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Trophy, Star, UserCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { mockLeagues } from "@/data/mockData";
import { useMemo } from "react";

const navItems = [
  { href: "/", icon: Home, label: "Matchs" },
  { href: "/live", icon: Zap, label: "Live", isLive: true },
  { href: "/news", icon: Newspaper, label: "News" },
  { href: "/competitions", icon: Trophy, label: "Coupes" },
  { href: "/favorites", icon: Star, label: "Favoris" },
  { href: "/profile", icon: UserCircle, label: "Profil" },
];

const BottomNav = () => {
  const location = useLocation();
  const { totalFavorites } = useFavorites();
  const { user } = useAuth();

  const liveCount = useMemo(() => {
    return mockLeagues.reduce(
      (acc, l) => acc + l.matches.filter((m) => m.status === "live").length,
      0
    );
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-header/95 backdrop-blur-md border-t border-header-foreground/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
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
              {/* Active indicator bar at top */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
              )}

              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110",
                    isLive && !active && "text-live"
                  )}
                />

                {/* Live count badge */}
                {isLive && liveCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 rounded-full bg-live text-[8px] font-black text-white flex items-center justify-center px-0.5">
                    {liveCount}
                  </span>
                )}

                {/* Favorites badge */}
                {isFavoriteTab && totalFavorites > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                    {totalFavorites > 9 ? "9+" : totalFavorites}
                  </span>
                )}

                {/* Auth hint dot for profile */}
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
