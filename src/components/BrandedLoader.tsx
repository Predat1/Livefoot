import { useState, useEffect } from "react";
import { useAppLogo } from "@/hooks/useAppLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface BrandedLoaderProps {
  variant?: "page" | "section" | "match";
  message?: string;
}

// 100% CSS — affiché sur CHAQUE navigation (Suspense fallback), donc zero JS.
const BrandedLoader = ({ variant = "section", message }: BrandedLoaderProps) => {
  const logoUrl = useAppLogo();
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRefresh(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleHardRefresh = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  if (variant === "match") {
    return <MatchSkeleton />;
  }

  return (
    <div
      className={
        variant === "page"
          ? "flex flex-col items-center justify-center min-h-[60vh] gap-5"
          : "flex flex-col items-center justify-center py-12 gap-4"
      }
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full border-2 border-primary/30 animate-bl-pulse" />
        <div
          className="absolute h-16 w-16 rounded-full border border-primary/20 animate-bl-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-xl shadow-primary/20 bg-card border border-border/50 animate-bl-breath">
          <img
            src={logoUrl}
            alt="LiveFoot"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>

      <div className="w-32 h-1 rounded-full bg-muted overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary animate-bl-bar" />
      </div>

      {showRefresh ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Le chargement prend plus de temps que prévu...
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHardRefresh}
            className="text-[10px] h-8 px-4 border-primary/30 text-primary hover:bg-primary/5"
          >
            Forcer la mise à jour
          </Button>
        </div>
      ) : message ? (
        <p className="text-xs text-muted-foreground font-medium animate-fade-in">
          {message}
        </p>
      ) : null}

      {/* Animations locales pour ne pas polluer index.css */}
      <style>{`
        @keyframes bl-pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes bl-breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes bl-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-bl-pulse { animation: bl-pulse 2s ease-in-out infinite; }
        .animate-bl-breath { animation: bl-breath 2s ease-in-out infinite; }
        .animate-bl-bar { animation: bl-bar 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

/** Skeleton liste de matchs (CSS uniquement) */
const MatchSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-xl sm:rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in"
        style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
      >
        <div className="px-4 py-3 bg-league-header flex items-center gap-3">
          <Skeleton className="h-5 w-7 rounded-sm" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {[0, 1].map((j) => (
          <div
            key={j}
            className="flex items-center justify-between px-3 sm:px-5 py-4 sm:py-5 border-b border-border/50 last:border-b-0"
          >
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <Skeleton className="h-3.5 w-20 sm:w-24" />
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
            </div>
            <div className="mx-3 sm:mx-6">
              <Skeleton className="h-8 w-16 sm:w-20 rounded-lg" />
            </div>
            <div className="flex flex-1 items-center gap-2 sm:gap-3">
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
              <Skeleton className="h-3.5 w-20 sm:w-24" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

/** Full-page skeleton for Match detail (CSS uniquement) */
const MatchDetailSkeleton = () => {
  const logoUrl = useAppLogo();

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <Skeleton className="h-8 w-24 rounded-lg" />

      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
        <div className="px-4 py-2.5 bg-league-header flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>

        <div className="px-4 sm:px-8 py-6 sm:py-8 flex items-center justify-between">
          <div className="flex flex-col items-center gap-3 flex-1">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl" />
            <Skeleton className="h-4 w-20 sm:w-28" />
          </div>

          <div className="flex flex-col items-center gap-2 mx-4">
            <img src={logoUrl} alt="" className="h-6 w-6 rounded-lg opacity-30" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <span className="text-xl font-bold text-muted-foreground/30">-</span>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl" />
            <Skeleton className="h-4 w-20 sm:w-28" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="rounded-2xl bg-card border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2 flex-1 mx-4 rounded-full" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { BrandedLoader, MatchSkeleton, MatchDetailSkeleton };
export default BrandedLoader;
