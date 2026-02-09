import { Search, Menu, Bell, Star, X, Download, Trophy, Users, Newspaper, ArrowRightLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useSearch } from "@/hooks/useSearch";
import { useFavorites } from "@/hooks/useFavorites";
import livefootLogo from "@/assets/livefoot-logo.png";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { query, setQuery, results } = useSearch();
  const { totalFavorites } = useFavorites();
  const searchRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "MATCHES", href: "/" },
    { label: "NEWS", href: "/news" },
    { label: "COMPETITIONS", href: "/competitions" },
    { label: "STANDINGS", href: "/standings" },
    { label: "TEAMS", href: "/teams" },
    { label: "PLAYERS", href: "/players" },
    { label: "TRANSFERS", href: "/transfers" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "team": return <Users className="h-4 w-4 text-primary" />;
      case "player": return <Star className="h-4 w-4 text-primary" />;
      case "competition": return <Trophy className="h-4 w-4 text-primary" />;
      case "news": return <Newspaper className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-header text-header-foreground shadow-lg">
        <div className="h-1 gradient-primary" />
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-4 sm:gap-10">
            <Link to="/" className="group flex items-center gap-2 sm:gap-3">
              <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl overflow-hidden shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
                <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black tracking-tight">LIVEFOOT</span>
                <span className="hidden sm:block text-[10px] font-medium text-header-foreground/60 tracking-widest">LIVE SCORES</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold transition-all duration-300 hover:text-primary",
                    isActive(item.href)
                      ? "text-primary"
                      : "text-header-foreground/70 hover:text-header-foreground"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search - Desktop */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="h-9 sm:h-10 w-[160px] xl:w-[220px] rounded-lg sm:rounded-xl border-header-foreground/10 bg-header-foreground/5 pl-9 sm:pl-10 text-xs sm:text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[200px] xl:focus:w-[280px] focus:bg-header-foreground/10 focus-visible:ring-primary"
              />
              {/* Search Results Dropdown */}
              {searchOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 w-[320px] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  {results.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { navigate(r.href); setSearchOpen(false); setQuery(""); }}
                    >
                      {getResultIcon(r.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                      <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                    </button>
                  ))}
                  <Link
                    to={`/search?q=${encodeURIComponent(query)}`}
                    className="block text-center py-2 text-xs font-medium text-primary hover:bg-muted/30 border-t border-border"
                    onClick={() => { setSearchOpen(false); }}
                  >
                    View all results →
                  </Link>
                </div>
              )}
            </div>

            <ThemeToggle />

            <Link to="/install" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Favorites */}
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="relative hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalFavorites > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {totalFavorites}
                  </span>
                )}
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live animate-pulse" />
            </Button>

            <Button className="hidden sm:flex h-9 sm:h-10 rounded-lg sm:rounded-xl gradient-primary font-semibold text-xs sm:text-sm shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105">
              Login
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground hover:bg-header-foreground/10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-[60px] left-0 right-0 bg-header border-b border-header-foreground/10 shadow-xl animate-fade-in">
            <nav className="container py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                    isActive(item.href)
                      ? "bg-primary/20 text-primary"
                      : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Favorites {totalFavorites > 0 && `(${totalFavorites})`}
              </Link>
              <Link
                to="/install"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install App
              </Link>
              <div className="mt-4 pt-4 border-t border-header-foreground/10">
                <Button className="w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30">
                  Login
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
