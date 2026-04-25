import { Search, Menu, X, Download, Trophy, Users, Newspaper, LogIn, LogOut, UserCircle, Zap, Star, ChevronDown, Grid3X3, Globe, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
import { useAppLogo } from "@/hooks/useAppLogo";
import { useIsAdmin } from "@/hooks/useAdmin";

const Header = () => {
  const logoUrl = useAppLogo();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { query, setQuery, results } = useSearch();
  const { totalFavorites } = useFavorites();
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mainNav = [
    { label: "MATCHS", href: "/" },
    { label: "PRONOS IA", href: "/daily-picks" },
    { label: "COMPÉTITIONS", href: "/competitions" },
    { label: "ÉQUIPES", href: "/teams" },
    { label: "TRANSFERTS", href: "/transfers" },
  ];

  const moreNav = [
    { label: "Live", href: "/live", icon: Zap },
    { label: "Classements", href: "/standings", icon: Trophy },
    { label: "Rankings", href: "/rankings", icon: Trophy },
    { label: "Pronos Communauté", href: "/predictions", icon: Users },
    { label: "Infos", href: "/news", icon: Newspaper },
    { label: "Favoris", href: "/favorites", icon: Star },
    { label: "Explorer", href: "/explorer", icon: Globe },
    { label: "Installer", href: "/install", icon: Download },
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
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-header/80 backdrop-blur-md shadow-lg border-b border-white/5" 
          : "bg-header shadow-lg"
      )}>
        {/* Green accent line */}
        <div className="h-[3px] gradient-primary" />

        {/* Main header row */}
        <div className="container flex h-12 sm:h-14 items-center gap-3 sm:gap-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2 flex-shrink-0">
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg overflow-hidden shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
              <img src={logoUrl} alt="LiveFoot" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm sm:text-lg font-black tracking-tight hidden sm:block">LIVEFOOT</span>
          </Link>

          {/* Desktop navigation - BeSoccer style */}
          <nav className="hidden lg:flex items-center gap-0 flex-1">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "relative px-3 xl:px-4 py-4 text-[13px] xl:text-sm font-bold tracking-wide transition-colors whitespace-nowrap",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-header-foreground/70 hover:text-header-foreground"
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="header-active-nav"
                    className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            {/* More dropdown */}
            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-4 text-[13px] xl:text-sm font-bold tracking-wide text-header-foreground/70 hover:text-header-foreground transition-colors">
                <span className="hidden xl:inline">PLUS</span>
                <Grid3X3 className="h-4 w-4 xl:hidden" />
                <ChevronDown className={cn("h-3 w-3 transition-transform", moreOpen && "rotate-180")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {moreNav.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Spacer for mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Desktop search — BeSoccer style: wide search bar */}
          <div className="relative hidden md:flex items-center" ref={searchRef}>
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Recherche..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="h-9 w-[200px] xl:w-[280px] rounded-lg border-header-foreground/15 bg-header-foreground/5 pl-4 pr-9 text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[260px] xl:focus:w-[340px] focus:bg-header-foreground/10 focus-visible:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
            </div>
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full mt-2 right-0 w-[340px]">
                {searchResults}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            {/* Auth button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex h-8 gap-1.5 rounded-lg border border-header-foreground/15 bg-header-foreground/5 text-header-foreground text-xs font-semibold hover:bg-header-foreground/15 px-3">
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
                      {totalFavorites > 0 && <span className="ml-auto text-xs text-primary">{totalFavorites}</span>}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/predictions" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Pronostics
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                <Button className="h-8 rounded-lg gradient-primary font-bold text-xs px-4 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all gap-1.5">
                  Entrer
                </Button>
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
              {[...mainNav, ...moreNav.map(m => ({ label: m.label.toUpperCase(), href: m.href }))].map((item) => (
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

              <div className="h-px bg-header-foreground/10 my-2" />

              {user ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 flex items-center gap-3"
                  >
                    <UserCircle className="h-4 w-4" />
                    {displayName}
                  </Link>
                  <button
                    className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-11 rounded-lg gradient-primary font-bold shadow-md gap-2">
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
