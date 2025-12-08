import { Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  const navItems = [
    { label: "MATCHES", href: "/", active: true },
    { label: "NEWS", href: "/news" },
    { label: "COMPETITIONS", href: "/competitions" },
    { label: "TEAMS", href: "/teams" },
    { label: "PLAYERS", href: "/players" },
    { label: "TRANSFERS", href: "/transfers" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-header text-header-foreground">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-primary-foreground">
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  className="fill-primary-foreground"
                />
                <path
                  d="M12 6l-1.5 3.5L7 11l3.5 1.5L12 16l1.5-3.5L17 11l-3.5-1.5z"
                  className="fill-primary"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">BESOCCER</span>
          </a>

          {/* Navigation - Desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  item.active ? "text-primary" : "text-header-foreground/80"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 w-[200px] bg-header-foreground/10 border-header-foreground/20 pl-9 text-sm text-header-foreground placeholder:text-header-foreground/50 focus-visible:ring-primary"
            />
          </div>

          {/* Login Button */}
          <Button
            variant="default"
            size="sm"
            className="hidden sm:flex"
          >
            Login
          </Button>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="text-header-foreground hover:bg-header-foreground/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
