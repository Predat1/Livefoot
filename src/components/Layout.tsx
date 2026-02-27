import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useAppLogo } from "@/hooks/useAppLogo";

interface LayoutProps {
  children: ReactNode;
}

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img src={logoUrl} alt="LiveFoot logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">LIVEFOOT</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Votre destination ultime pour les scores en direct, résultats, calendriers, classements, statistiques et actualités football.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
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
