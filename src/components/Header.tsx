import { Search, Menu, X, Trophy, Star, Newspaper, Zap, Users, Loader2, Gift, ArrowRight, Crown, LogIn, User, Shield, Ticket } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSearch } from "@/hooks/useSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { useAppLogo } from "@/hooks/useAppLogo";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { usePredictionTicket } from "@/contexts/PredictionTicketContext";


const Header = () => {
  const logoUrl = useAppLogo();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { query, setQuery, results, isLoading } = useSearch();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { count: ticketCount } = usePredictionTicket();

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mainNav = [
    { label: t("nav.matches"), href: "/" },
    { label: t("nav.vip"), href: "/vip" },
    { label: t("nav.predictions"), href: "/daily-picks" },
    { label: t("nav.live"), href: "/live" },
    { label: t("nav.competitions"), href: "/competitions" },
    { label: t("nav.news"), href: "/news" },
    { label: t("nav.bonuses"), href: "/bonuses" },
    { label: t("nav.install"), href: "/install" },
  ];

  const location = useLocation();
  
  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "match": return <Zap className="h-4 w-4 text-primary" />;
      case "team": return <Users className="h-4 w-4 text-primary" />;
      case "player": return <Star className="h-4 w-4 text-primary" />;
      case "competition": return <Trophy className="h-4 w-4 text-primary" />;
      case "news": return <Newspaper className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  

  const handleSearchSelect = (href: string) => {
    navigate(href);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
  };

  const getFavoriteType = (type: string) => {
    if (type === "team") return "teams";
    if (type === "player") return "players";
    if (type === "competition") return "competitions";
    return null;
  };

  const resultGroups = [
    { type: "match", label: "Matchs" },
    { type: "team", label: "Equipes" },
    { type: "competition", label: "Competitions" },
    { type: "player", label: "Joueurs" },
    { type: "news", label: "Actualites" },
  ] as const;

  const searchResults = (
    <div className="z-50 max-h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {results.length > 0 ? `${results.length} resultat${results.length > 1 ? "s" : ""}` : "Recherche"}
        </span>
        {query && <span className="max-w-[170px] truncate text-[10px] text-muted-foreground">"{query}"</span>}
      </div>

      <div className="max-h-[56vh] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Recherche en cours...
          </div>
        ) : results.length > 0 ? (
          <>
            {resultGroups.map(({ type, label }) => {
              const typeResults = results.filter((result) => result.type === type).slice(0, type === "match" ? 6 : 4);
              if (typeResults.length === 0) return null;

              return (
                <div key={type} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {getResultIcon(type)}
                    <span>{label}</span>
                    <span className="h-px flex-1 bg-border/50" />
                  </div>

                  {typeResults.map((result, index) => {
                    const favType = getFavoriteType(result.type);
                    const isFav = favType ? isFavorite(favType as any, result.id) : false;

                    return (
                      <motion.button
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSearchSelect(result.href)}
                        className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted">
                          {result.image ? <img src={result.image} alt="" className="h-full w-full object-contain p-1" /> : getResultIcon(result.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">{result.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{result.subtitle}</p>
                        </div>
                        {favType && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(favType as any, result.id, result.name);
                            }}
                            className="rounded-full p-1.5 text-muted-foreground opacity-70 transition hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                          >
                            <Star className={cn("h-3.5 w-3.5", isFav && "fill-amber-400 text-amber-400")} />
                          </button>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}

            <Link
              to={`/search?q=${encodeURIComponent(query)}`}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary/5 py-2.5 text-xs font-black text-primary transition hover:bg-primary/10"
              onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
            >
              <Search className="h-3.5 w-3.5" />
              Voir la recherche complete
              <ArrowRight className="h-3 w-3" />
            </Link>
          </>
        ) : query.trim().length >= 2 ? (
          <div className="px-4 py-8 text-center">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-bold text-foreground">Aucun resultat rapide</p>
            <p className="mb-4 text-xs text-muted-foreground">Essayez la recherche complete pour "{query}".</p>
            <Link
              to={`/search?q=${encodeURIComponent(query)}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20"
              onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
            >
              Recherche avancee <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="px-4 py-7 text-center">
            <p className="text-xs text-muted-foreground">Tapez au moins 2 caracteres</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-header/80 backdrop-blur-md shadow-lg border-b border-white/5" 
          : "bg-header shadow-lg"
      )}>
        {/* Green accent line */}
        <div className="h-[3px] gradient-primary" />

        {/* Main header row */}
        <div className="container flex h-12 sm:h-14 items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2 flex-shrink-0">
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg gradient-primary overflow-hidden shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-110 border border-white/10">
              <img src="/logo.svg" alt="LiveFoot" className="h-5 w-5 sm:h-6 sm:w-6 brightness-0 invert" />
            </div>
            <span className="text-sm sm:text-lg font-black tracking-tighter hidden sm:block">LIVEFOOT<span className="text-primary ml-0.5">AI</span></span>
          </Link>

          {/* Desktop navigation - BeSoccer style */}
          <nav className="hidden lg:flex items-center gap-0 flex-1 overflow-x-auto scrollbar-hide">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "relative px-2 xl:px-4 py-4 text-[11px] xl:text-sm font-bold tracking-tight xl:tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-header-foreground/70 hover:text-header-foreground"
                )}
              >
                {item.href === "/vip" && <Crown className="h-3 w-3 text-amber-400" />}
                {item.href === "/bonuses" && <Gift className="h-3 w-3 text-primary animate-pulse" />}
                {item.label}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="header-active-nav"
                    className="absolute bottom-0 left-1 right-1 h-[3px] rounded-t-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop search — Enhanced search bar */}
          <div className="relative hidden lg:flex items-center ml-2" ref={searchRef}>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-header-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher équipes, joueurs, matchs..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setQuery('');
                      searchInputRef.current?.blur();
                    } else if (e.key === 'Enter' && query.trim().length >= 2) {
                      handleSearchSelect(`/search?q=${encodeURIComponent(query)}`);
                    }
                  }}
                  className="h-9 xl:h-10 w-[200px] xl:w-[320px] rounded-xl border border-header-foreground/20 bg-header-foreground/10 pl-10 pr-16 text-[12px] xl:text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 group-focus-within:w-[280px] xl:group-focus-within:w-[400px] group-focus-within:bg-header-foreground/20 group-focus-within:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <button
                      onClick={() => { setQuery(''); setSearchOpen(false); searchInputRef.current?.focus(); }}
                      className="p-1 rounded-md hover:bg-header-foreground/10 text-header-foreground/40 hover:text-header-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded border border-header-foreground/20 bg-header-foreground/5 px-1.5 text-[10px] font-medium text-header-foreground/50">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
            {searchOpen && query.trim().length >= 2 && (
              <div className="absolute top-full mt-2 right-0 w-[280px] xl:w-[400px]">
                {searchResults}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto lg:ml-0">
            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary lg:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />
            <LanguageSwitcher />

            <Link
              to="/tickets"
              className={cn(
                "hidden lg:flex relative h-8 rounded-lg border px-3 items-center gap-1.5 text-xs font-bold transition-colors",
                isActive("/tickets")
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-header-foreground/5 border-header-foreground/10 text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
              )}
              title="Mes tickets de predictions"
            >
              <Ticket className="h-3.5 w-3.5" />
              Mes tickets
              {ticketCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-amber-400 px-1 text-[8px] font-black text-black flex items-center justify-center">
                  {ticketCount > 9 ? "9+" : ticketCount}
                </span>
              )}
            </Link>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/profile"
                  className="group flex items-center gap-2"
                >
                  <div className="hidden sm:flex flex-col items-end gap-0.5 mr-1">
                    <span className="text-[10px] font-black text-primary leading-none uppercase">{profile?.rank_title || "Débutant"}</span>
                    <span className="text-[9px] font-bold text-header-foreground/40 leading-none">{profile?.points || 0} pts</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs font-black">
                        {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-header-foreground/50 hover:text-red-400 hover:bg-red-500/10 hidden lg:flex"
                  onClick={() => signOut()}
                  title="Déconnexion"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="h-8 rounded-lg bg-primary/20 border border-primary/30 px-3 flex items-center gap-1.5 text-primary hover:bg-primary/30 transition-colors text-xs font-bold"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}

            {/* Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-header-foreground hover:bg-header-foreground/10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-header-foreground/10 bg-header px-4 py-3 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
              <Input
                ref={mobileSearchRef}
                placeholder="Rechercher équipes, joueurs..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim().length >= 2) {
                    handleSearchSelect(`/search?q=${encodeURIComponent(query)}`);
                  } else if (e.key === 'Escape') {
                    setMobileSearchOpen(false);
                    setSearchOpen(false);
                  }
                }}
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
            {searchOpen && query.trim().length >= 2 && (
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
          <div className="absolute top-[52px] left-0 right-0 bg-header border-b border-header-foreground/10 shadow-2xl max-h-[80vh] overflow-y-auto animate-fade-in">
            <nav className="container py-2 flex flex-col gap-0.5">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3",
                    isActive(item.href)
                      ? "bg-primary/15 text-primary"
                      : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              ))}

              {/* Auth section in mobile menu */}
              <div className="border-t border-header-foreground/10 mt-2 pt-2">
                {user ? (
                  <>
                    <Link
                      to="/tickets"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3",
                        isActive("/tickets")
                          ? "bg-primary/15 text-primary"
                          : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                      )}
                    >
                      <Ticket className="h-4 w-4" />
                      Mes tickets
                      {ticketCount > 0 && (
                        <span className="ml-auto h-5 min-w-5 rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-black flex items-center justify-center">
                          {ticketCount > 9 ? "9+" : ticketCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3 text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                    >
                      <User className="h-4 w-4" />
                      {profile?.display_name || "Mon Profil"}
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3 text-red-400 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/tickets"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3",
                        isActive("/tickets")
                          ? "bg-primary/15 text-primary"
                          : "text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground"
                      )}
                    >
                      <Ticket className="h-4 w-4" />
                      Mes tickets
                      {ticketCount > 0 && (
                        <span className="ml-auto h-5 min-w-5 rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-black flex items-center justify-center">
                          {ticketCount > 9 ? "9+" : ticketCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-3 text-primary hover:bg-primary/10"
                    >
                      <LogIn className="h-4 w-4" />
                      Connexion / Inscription
                    </Link>
                  </>
                )}
              </div>

            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
