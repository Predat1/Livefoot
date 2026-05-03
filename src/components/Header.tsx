import { Search, Menu, X, Trophy, Star, Newspaper, Zap, Users, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useSearch } from "@/hooks/useSearch";
import { useAppLogo } from "@/hooks/useAppLogo";

const Header = () => {
  const logoUrl = useAppLogo();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { query, setQuery, results, isLoading } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mainNav = [
    { label: "MATCHS", href: "/" },
    { label: "PRONOS IA", href: "/daily-picks" },
    { label: "LIVE", href: "/live" },
    { label: "COMPÉTITIONS", href: "/competitions" },
    { label: "ACTUALITÉS", href: "/news" },
    { label: "INSTALLER", href: "/install" },
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

  const searchResults = (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Recherche en cours...</p>
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left group"
              onClick={() => handleSearchSelect(r.href)}
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary/30 transition-colors">
                {r.image ? (
                  <img src={r.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  getResultIcon(r.type)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{r.name}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">{r.subtitle}</p>
              </div>
              <span className="text-[9px] font-black uppercase text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">{r.type}</span>
            </button>
          ))}
          <Link
            to={`/search?q=${encodeURIComponent(query)}`}
            className="block text-center py-2.5 text-xs font-black text-primary hover:bg-primary/5 border-t border-border uppercase tracking-widest"
            onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); }}
          >
            Voir tous les résultats
          </Link>
        </>
      ) : query.length >= 3 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Aucun résultat pour "{query}"</p>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Tapez au moins 3 caractères</p>
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
        <div className="container flex h-12 sm:h-14 items-center gap-3 sm:gap-6">
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
                  "relative px-2 xl:px-4 py-4 text-[11px] xl:text-sm font-bold tracking-tight xl:tracking-wide transition-colors whitespace-nowrap",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-header-foreground/70 hover:text-header-foreground"
                )}
              >
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

          {/* Desktop search — BeSoccer style: wide search bar */}
          <div className="relative hidden lg:flex items-center ml-2" ref={searchRef}>
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Recherche..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="h-8 xl:h-9 w-[180px] xl:w-[280px] rounded-lg border-header-foreground/15 bg-header-foreground/5 pl-4 pr-9 text-[12px] xl:text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[240px] xl:focus:w-[340px] focus:bg-header-foreground/10 focus-visible:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-header-foreground/40" />
            </div>
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full mt-2 right-0 w-[240px] xl:w-[340px]">
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
              className="h-8 w-8 rounded-lg text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary lg:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />


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

            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
