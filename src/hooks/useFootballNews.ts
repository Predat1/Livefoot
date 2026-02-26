import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  source: string;
  link: string;
  views: number;
  trending: boolean;
}

async function fetchFootballNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase.functions.invoke("football-news");

  if (error) throw new Error(`News fetch error: ${error.message}`);
  return (data as any)?.articles || [];
}

export function useFootballNews() {
  return useQuery({
    queryKey: ["football-news"],
    queryFn: fetchFootballNews,
    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 30 * 60 * 1000,
  });
}

// Extract unique categories from live data
export function useNewsCategories(articles: NewsArticle[]) {
  const categories = ["All", ...new Set(articles.map((a) => a.category))];
  return categories;
}
