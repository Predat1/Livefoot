import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/livefoot-logo.png";

export function useAppLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);

  useEffect(() => {
    const { data } = supabase.storage.from("logos").getPublicUrl("logo.png");
    if (data?.publicUrl) {
      const img = new Image();
      const url = data.publicUrl + "?t=" + Date.now();
      img.onload = () => setLogoUrl(url);
      img.onerror = () => setLogoUrl(defaultLogo);
      img.src = url;
    }

    // Also update favicon dynamically
    const { data: favData } = supabase.storage.from("logos").getPublicUrl("favicon.png");
    if (favData?.publicUrl) {
      const favImg = new Image();
      const favUrl = favData.publicUrl + "?t=" + Date.now();
      favImg.onload = () => {
        const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (faviconLink) faviconLink.href = favUrl;
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (appleIcon) appleIcon.href = favUrl;
      };
      favImg.src = favUrl;
    }
  }, []);

  return logoUrl;
}
