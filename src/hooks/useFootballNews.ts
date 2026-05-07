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
export function useNewsCategories(articles: NewsArticle[] = []) {
  if (!articles || !Array.isArray(articles)) return ["All"];
  const categories = ["All", ...new Set(articles.map((a) => a?.category).filter(Boolean))];
  return categories;
}

export function usePersonalizedNews(favorites: { teams?: any[], competitions?: any[] } = {}) {
  const { data: articles, ...rest } = useFootballNews();
  
  const teams = favorites?.teams || [];
  const competitions = favorites?.competitions || [];
  
  const personalized = articles?.filter(article => {
    if (!article) return false;
    // Check if article content or title matches any favorite team/competition name
    const matches = [...teams, ...competitions].some(fav => {
      if (!fav) return false;
      const name = String(fav).toLowerCase();
      return (article.title?.toLowerCase().includes(name) || 
             article.content?.toLowerCase().includes(name) ||
             article.summary?.toLowerCase().includes(name));
    });
    return matches;
  }) || [];

  return { data: personalized, ...rest };
}
