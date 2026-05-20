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

  const searchResults = (

    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header with query info */}
            <div className="sticky top-0 z-10 bg-card/98 backdrop-blur-xl border-b border-border/30 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {results.length > 0 ? `${results.length} résultat${results.length > 1 ? 's' : ''}` : 'Recherche'}
              </span>
              {query && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  "{query}"
                </span>
              )}
            </div>

            <div className="p-2">
              {results.length > 0 ? (
                <>
                  {/* Group results by type */}
                  {['teams', 'players', 'competitions'].map(type => {
                    const typeResults = results.filter(r => r.type === type);
                    if (typeResults.length === 0) return null;

                    return (
                      <div key={type} className="mb-2 last:mb-0">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          {type === 'teams' && <Shield className="h-3.5 w-3.5 text-primary" />}
                          {type === 'players' && <User className="h-3.5 w-3.5 text-accent" />}
                          {type === 'competitions' && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {type === 'teams' ? 'Équipes' : type === 'players' ? 'Joueurs' : 'Compétitions'}
                          </span>
                          <div className="flex-1 h-px bg-border/30 ml-2" />
                        </div>

                        {typeResults.map((r, index) => {
                          const isFav = isFavorite(type as any, r.id);
                          return (
                            <motion.button
                              key={`${r.type}-${r.id}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => navigateTo(r)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-primary/5 active:scale-[0.98] group"
                            >
                              <div className="relative h-9 w-9 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary/30 transition-all group-hover:shadow-md">
                                {r.image ? (
                                  <img src={r.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  getResultIcon(r.type)
                                )}
                                {isFav && (
                                  <div className="absolute -top-1 -right-1">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{r.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(type as any, r.id, r.name);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Star className={cn("h-3.5 w-3.5", isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50")} />
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })}

                  <Link
                    to={`/search?q=${encodeURIComponent(query)}`}
                    className="flex items-center justify-center gap-2 w-full mt-2 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-xs font-black text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Voir tous les résultats
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              ) : query.length >= 3 ? (
                <div className="py-10 text-center px-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Aucun résultat</p>
                  <p className="text-xs text-muted-foreground mb-4">pour "{query}"</p>
                  <Link
                    to={`/search?q=${encodeURIComponent(query)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                    onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
                  >
                    Recherche avancée <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="py-8 text-center px-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tapez au moins 3 caractères</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">pour commencer la recherche</p>
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="sticky bottom-0 bg-card/98 backdrop-blur-xl border-t border-border/30 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[9px]">↑↓</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[9px]">↵</kbd>
                  <span>sélectionner</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[9px]">esc</kbd>
                <span>fermer</span>
              </span>
            </div>
          </div>
        </div>
      ) : query.length >= 3 ? (
        <div className="py-10 text-center px-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Aucun résultat</p>
          <p className="text-xs text-muted-foreground mb-4">pour "{query}"</p>
          <Link
            to={`/search?q=${encodeURIComponent(query)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
            onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
          >
            Recherche avancée <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="py-8 text-center px-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Tapez au moins 3 caractères</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">pour commencer la recherche</p>
        </div>
      )}
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
            {searchOpen && results.length > 0 && (
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
