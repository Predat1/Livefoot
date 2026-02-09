import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCountryFlag } from "@/utils/logoUrls";

interface CountryFlagProps {
  country: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-6",
  md: "h-5 w-7",
  lg: "h-6 w-9",
};

const CountryFlag = ({ country, size = "sm", className }: CountryFlagProps) => {
  const [hasError, setHasError] = useState(false);
  const flagUrl = getCountryFlag(country);

  if (!flagUrl || hasError) {
    return (
      <span className={cn("inline-flex items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground px-1", className)}>
        {country.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={flagUrl}
      alt={country}
      loading="lazy"
      className={cn("rounded-sm object-cover shadow-sm", sizeMap[size], className)}
      onError={() => setHasError(true)}
    />
  );
};

export default CountryFlag;
