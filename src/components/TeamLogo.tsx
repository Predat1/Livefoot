import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTeamLogo } from "@/utils/logoUrls";

interface TeamLogoProps {
  teamName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5",
  sm: "h-6 w-6 sm:h-8 sm:w-8",
  md: "h-10 w-10 sm:h-12 sm:w-12",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
  xl: "h-16 w-16 sm:h-20 sm:w-20",
};

const imgSizeMap = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4 sm:h-6 sm:w-6",
  md: "h-7 w-7 sm:h-9 sm:w-9",
  lg: "h-10 w-10 sm:h-12 sm:w-12",
  xl: "h-12 w-12 sm:h-16 sm:w-16",
};

const textSizeMap = {
  xs: "text-[8px]",
  sm: "text-[10px] sm:text-xs",
  md: "text-xs sm:text-sm",
  lg: "text-sm sm:text-base",
  xl: "text-base sm:text-xl",
};

const TeamLogo = ({ teamName, size = "sm", className }: TeamLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getTeamLogo(teamName);
  const initials = teamName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3);

  if (!logoUrl || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted/80 font-bold text-muted-foreground",
          sizeMap[size],
          className
        )}
      >
        <span className={textSizeMap[size]}>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-muted/80 shadow-sm",
        sizeMap[size],
        className
      )}
    >
      <img
        src={logoUrl}
        alt={teamName}
        loading="lazy"
        className={cn("object-contain", imgSizeMap[size])}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default TeamLogo;
