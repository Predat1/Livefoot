import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {children}
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 sm:py-12 mt-6 sm:mt-8">
        <div className="container text-center">
          <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl gradient-primary shadow-lg shadow-primary/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7 fill-primary-foreground">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="12,6 13.5,10 18,10 14.5,13 16,18 12,15 8,18 9.5,13 6,10 10.5,10" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">LIVEFOOT</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
            Your ultimate destination for live scores, results, fixtures, tables, statistics and football news.
          </p>
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {["About", "Contact", "Privacy", "Terms"].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link}
              </a>
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
