import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
  initialItems: T[];
  itemsPerPage?: number;
  loadMoreItems?: () => T[];
}

export const useInfiniteScroll = <T,>({
  initialItems,
  itemsPerPage = 10,
  loadMoreItems,
}: UseInfiniteScrollOptions<T>) => {
  const [items, setItems] = useState<T[]>(initialItems.slice(0, itemsPerPage));
  const [hasMore, setHasMore] = useState(initialItems.length > itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // React to changes in initialItems (async data loading)
  useEffect(() => {
    setItems(initialItems.slice(0, itemsPerPage));
    setHasMore(initialItems.length > itemsPerPage);
  }, [initialItems, itemsPerPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 300));

    const currentLength = items.length;
    const nextItems = loadMoreItems 
      ? loadMoreItems() 
      : initialItems.slice(currentLength, currentLength + itemsPerPage);

    if (nextItems.length === 0) {
      setHasMore(false);
    } else {
      setItems((prev) => [...prev, ...nextItems]);
      if (currentLength + nextItems.length >= initialItems.length) {
        setHasMore(false);
      }
    }

    setIsLoading(false);
  }, [items.length, isLoading, hasMore, initialItems, itemsPerPage, loadMoreItems]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  const reset = useCallback(() => {
    setItems(initialItems.slice(0, itemsPerPage));
    setHasMore(initialItems.length > itemsPerPage);
  }, [initialItems, itemsPerPage]);

  return {
    items,
    hasMore,
    isLoading,
    loadMoreRef,
    reset,
  };
};
