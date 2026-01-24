import { Search, Menu, Bell, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  
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
    <header className="sticky top-0 z-50 bg-header text-header-foreground shadow-lg">
      {/* Top accent line */}
      <div className="h-1 gradient-primary" />
      
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-primary-foreground">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="12,6 13.5,10 18,10 14.5,13 16,18 12,15 8,18 9.5,13 6,10 10.5,10" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight">BESOCCER</span>
              <span className="text-[10px] font-medium text-header-foreground/60 tracking-widest">LIVE SCORES</span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-primary",
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
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/40" />
            <Input
              placeholder="Search teams, players..."
              className="h-10 w-[220px] rounded-xl border-header-foreground/10 bg-header-foreground/5 pl-10 text-sm text-header-foreground placeholder:text-header-foreground/40 transition-all duration-300 focus:w-[280px] focus:bg-header-foreground/10 focus-visible:ring-primary"
            />
          </div>

          {/* Favorites */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
          >
            <Star className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl text-header-foreground/70 hover:bg-header-foreground/10 hover:text-primary"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-live animate-pulse" />
          </Button>

          {/* Login Button */}
          <Button
            className="hidden sm:flex h-10 rounded-xl gradient-primary font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
          >
            Login
          </Button>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-header-foreground hover:bg-header-foreground/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
