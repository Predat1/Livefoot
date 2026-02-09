import { useState } from "react";
import { cn } from "@/lib/utils";
import { getLeagueLogo } from "@/utils/logoUrls";
import { Trophy } from "lucide-react";

interface LeagueLogoProps {
  leagueId: string;
  leagueName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-6 w-6 sm:h-8 sm:w-8",
  md: "h-10 w-10 sm:h-12 sm:w-12",
  lg: "h-12 w-12 sm:h-14 sm:w-14",
};

const imgSizeMap = {
  sm: "h-5 w-5 sm:h-6 sm:w-6",
  md: "h-8 w-8 sm:h-10 sm:w-10",
  lg: "h-10 w-10 sm:h-12 sm:w-12",
};

const LeagueLogo = ({ leagueId, leagueName, size = "sm", className }: LeagueLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getLeagueLogo(leagueId);

  if (!logoUrl || hasError) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-muted/80", sizeMap[size], className)}>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", sizeMap[size], className)}>
      <img
        src={logoUrl}
        alt={leagueName || leagueId}
        loading="lazy"
        className={cn("object-contain", imgSizeMap[size])}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default LeagueLogo;
