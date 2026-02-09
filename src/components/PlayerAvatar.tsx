import { useState } from "react";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 sm:h-10 sm:w-10",
  md: "h-10 w-10 sm:h-12 sm:w-12",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
  xl: "h-20 w-20 sm:h-24 sm:w-24",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base sm:text-lg",
  xl: "text-xl sm:text-2xl",
};

const PlayerAvatar = ({ name, photoUrl, size = "md", className }: PlayerAvatarProps) => {
  const [hasError, setHasError] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  if (!photoUrl || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full gradient-primary font-black text-primary-foreground shadow-lg shadow-primary/20",
          sizeMap[size],
          className
        )}
      >
        <span className={textSizeMap[size]}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-full shadow-lg", sizeMap[size], className)}>
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default PlayerAvatar;
