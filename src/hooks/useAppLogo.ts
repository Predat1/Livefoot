import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/livefoot-logo.png";

export function useAppLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);

  useEffect(() => {
    const { data } = supabase.storage.from("logos").getPublicUrl("logo.png");
    if (data?.publicUrl) {
      // Check if the file exists by loading it
      const img = new Image();
      img.onload = () => setLogoUrl(data.publicUrl + "?t=" + Date.now());
      img.onerror = () => setLogoUrl(defaultLogo);
      img.src = data.publicUrl + "?t=" + Date.now();
    }
  }, []);

  return logoUrl;
}
