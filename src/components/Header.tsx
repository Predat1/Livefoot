import { Search, Menu, Bell, Star, X, Download } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import livefootLogo from "@/assets/livefoot-logo.png";

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { label: "MATCHES", href: "/" },
    { label: "NEWS", href: "/news" },
    { label: "COMPETITIONS", href: "/competitions" },
    { label: "TEAMS", href: "/teams" },
    { label: "PLAYERS", href: "/players" },
    { label: "TRANSFERS", href: "/transfers" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-header text-header-foreground shadow-lg">
        {/* Top accent line */}
        <div className="h-1 gradient-primary" />
        
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
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

            {/* Navigation - Desktop */}
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

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search - Desktop only */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
              <Input
                placeholder="Search..."
                className="h-9 sm:h-10 w-[160px] xl:w-[220px] rounded-lg sm:rounded-xl border-header-foreground/10 bg-header-foreground/5 pl-9 sm:pl-10 text-xs sm:text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[200px] xl:focus:w-[280px] focus:bg-header-foreground/10 focus-visible:ring-primary"
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Install App - Desktop only */}
            <Link to="/install" className="hidden sm:block">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Favorites - Desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
            >
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-live animate-pulse" />
            </Button>

            {/* Login Button - Desktop only */}
            <Button
              className="hidden sm:flex h-9 sm:h-10 rounded-lg sm:rounded-xl gradient-primary font-semibold text-xs sm:text-sm shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
            >
              Login
            </Button>

            {/* Mobile Menu Toggle */}
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

      {/* Mobile Menu */}
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
                to="/install"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-header-foreground/70 hover:bg-header-foreground/10 hover:text-header-foreground flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install App
              </Link>
              <div className="mt-4 pt-4 border-t border-header-foreground/10">
                <Button
                  className="w-full h-11 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30"
                >
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
