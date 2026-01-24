import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: isRefreshing ? 60 : pullDistance }}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg",
          isRefreshing && "animate-spin"
        )}
        style={{
          opacity: Math.min(progress, 1),
          transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 360}deg)`,
        }}
      >
        <RefreshCw className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
