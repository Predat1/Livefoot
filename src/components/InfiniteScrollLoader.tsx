import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
}

const InfiniteScrollLoader = forwardRef<HTMLDivElement, InfiniteScrollLoaderProps>(
  ({ isLoading, hasMore }, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-center py-6">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        )}
        {!hasMore && !isLoading && (
          <p className="text-sm text-muted-foreground">No more items to load</p>
        )}
      </div>
    );
  }
);

InfiniteScrollLoader.displayName = "InfiniteScrollLoader";

export default InfiniteScrollLoader;
