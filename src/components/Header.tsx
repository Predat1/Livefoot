import { Search, Menu, Bell, Star, X, Download, Trophy, Users, Newspaper, LogIn, LogOut, UserCircle, Zap } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useSearch } from "@/hooks/useSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import livefootLogo from "@/assets/livefoot-logo.png";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { query, setQuery, results } = useSearch();
  const { totalFavorites } = useFavorites();
  const { user, profile, signOut } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { label: "MATCHES", href: "/", icon: Zap },
    { label: "LIVE", href: "/live", icon: Zap, isLive: true },
    { label: "NEWS", href: "/news", icon: Newspaper },
    { label: "COMPETITIONS", href: "/competitions", icon: Trophy },
    { label: "STANDINGS", href: "/standings", icon: Trophy },
    { label: "TEAMS", href: "/teams", icon: Users },
    { label: "PLAYERS", href: "/players", icon: UserCircle },
    { label: "TRANSFERS", href: "/transfers", icon: Star },
    { label: "PRONOSTICS", href: "/predictions", icon: Trophy },
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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      if (window.innerWidth < 768) {
        setMobileSearchOpen(true);
        setTimeout(() => mobileSearchRef.current?.focus(), 100);
      } else {
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    if (e.key === "Escape") {
      setMobileSearchOpen(false);
      setSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const handleSearchSelect = (href: string) => {
    navigate(href);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
  };

  const searchResults = (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
      {results.map((r) => (
        <button
          key={`${r.type}-${r.id}`}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          onClick={() => handleSearchSelect(r.href)}
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
        onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
      >
        Voir tous les résultats →
      </Link>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-header text-header-foreground shadow-lg">
        <div className="h-1 gradient-primary" />
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-4 sm:gap-10 min-w-0">
            <Link to="/" className="group flex items-center gap-2 flex-shrink-0">
              <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl overflow-hidden shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
                <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black tracking-tight">LIVEFOOT</span>
                <span className="hidden sm:block text-[10px] font-medium text-header-foreground/60 tracking-widest">LIVE SCORES</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold transition-all duration-300 hover:text-primary flex items-center gap-1",
                    isActive(item.href)
                      ? "text-primary"
                      : item.isLive
                        ? "text-live hover:text-live"
                        : "text-header-foreground/70 hover:text-header-foreground"
                  )}
                >
                  {item.isLive && <Zap className="h-3 w-3" />}
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Desktop search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
              <Input
                ref={searchInputRef}
                placeholder="Search... (/)"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="h-9 sm:h-10 w-[160px] xl:w-[220px] rounded-lg sm:rounded-xl border-header-foreground/10 bg-header-foreground/5 pl-9 sm:pl-10 text-xs sm:text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[200px] xl:focus:w-[280px] focus:bg-header-foreground/10 focus-visible:ring-primary"
              />
              {searchOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 left-0 w-[320px]">
                  {searchResults}
                </div>
              )}
            </div>

            <ThemeToggle />

            <Link to="/install" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Favorites - desktop only */}
            <Link to="/favorites" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalFavorites > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {totalFavorites}
                  </span>
                )}
              </Button>
            </Link>

            {/* Notifications - desktop only */}
            <Link to="/favorites" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
              </Button>
            </Link>

            {/* Auth - Desktop */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex h-9 sm:h-10 gap-2 rounded-lg sm:rounded-xl border border-header-foreground/20 bg-header-foreground/10 text-header-foreground text-xs sm:text-sm font-semibold hover:bg-header-foreground/20">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[80px] truncate">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" /> Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center gap-2">
                      <Star className="h-4 w-4" /> Mes Favoris
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/predictions" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Pronostics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden sm:block">
                <Button className="h-9 sm:h-10 rounded-lg sm:rounded-xl gradient-primary font-semibold text-xs sm:text-sm shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}

            {/* Hamburger - mobile/tablet */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-header-foreground hover:bg-header-foreground/10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search bar - slides down */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-header-foreground/10 bg-header px-4 py-3 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
              <Input
                ref={mobileSearchRef}
                placeholder="Rechercher équipes, joueurs, compétitions..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                autoFocus
                className="h-10 w-full rounded-xl border-header-foreground/10 bg-header-foreground/5 pl-10 pr-10 text-sm text-header-foreground placeholder:text-header-foreground/40 focus-visible:ring-primary"
              />
              <button
                onClick={() => { setMobileSearchOpen(false); setQuery(""); setSearchOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-header-foreground/40 hover:text-header-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {searchOpen && results.length > 0 && (
              <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl">
                {searchResults}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-[60px] left-0 right-0 bg-header border-b border-header-foreground/10 shadow-2xl max-h-[80vh] overflow-y-auto animate-fade-in">
            <nav className="container py-3 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3",
                    isActive(item.href)
                      ? "bg-primary/20 text-primary"
                      : item.isLive
                        ? "text-live hover:bg-live/10"
                        : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              ))}

              <div className="h-px bg-header-foreground/10 my-2" />

              <Link
                to="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground flex items-center gap-3"
              >
                <Star className="h-4 w-4" />
                Favoris {totalFavorites > 0 && <span className="ml-auto text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">{totalFavorites}</span>}
              </Link>
              <Link
                to="/install"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground flex items-center gap-3"
              >
                <Download className="h-4 w-4" />
                Installer l'app
              </Link>

              <div className="h-px bg-header-foreground/10 my-2" />

              {user ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 flex items-center gap-3"
                  >
                    <UserCircle className="h-4 w-4" />
                    {displayName}
                  </Link>
                  <button
                    className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30 gap-2">
                    <LogIn className="h-4 w-4" />
                    Connexion / Inscription
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
