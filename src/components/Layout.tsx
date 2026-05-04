import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useAppLogo } from "@/hooks/useAppLogo";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const footerLinks = [
  { label: "Bonus & Offres", href: "/bonuses" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Confidentialité", href: "/privacy" },
  { label: "Conditions", href: "/terms" },
];

const Layout = ({ children }: LayoutProps) => {
  const logoUrl = useAppLogo();
  return (
    <div className="min-h-screen bg-background pb-safe lg:pb-0">
      <Header />
      {children}
      
      {/* Footer - hidden on mobile */}
      <footer className="hidden lg:block border-t border-border bg-card py-8 sm:py-12 mt-6 sm:mt-8">
        <div className="container text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-primary/30 gradient-primary p-2 border border-white/10">
              <img src="/logo.svg" alt="LiveFoot logo" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tighter">LIVEFOOT<span className="text-primary ml-1">AI</span></span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Votre destination ultime pour les scores en direct, résultats, calendriers, classements, statistiques et actualités football.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1.5",
                  link.href === "/bonuses" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
                )}
              >
                {link.href === "/bonuses" && <Gift className="h-3.5 w-3.5" />}
                {link.label}
                {link.href === "/bonuses" && (
                  <span className="text-[8px] bg-primary text-primary-foreground px-1 rounded-sm">NEW</span>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">𝕏 Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Instagram</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">YouTube</a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} LiveFoot. Tous droits réservés.
          </p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};

export default Layout;
