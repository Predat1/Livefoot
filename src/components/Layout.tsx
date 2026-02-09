import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import livefootLogo from "@/assets/livefoot-logo.png";

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
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {children}
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 sm:py-12 mt-6 sm:mt-8">
        <div className="container text-center">
          <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-primary/30">
              <img src={livefootLogo} alt="LiveFoot logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">LIVEFOOT</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
            Your ultimate destination for live scores, results, fixtures, tables, statistics and football news.
          </p>
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-muted-foreground/60">
            © 2024 LiveFoot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
