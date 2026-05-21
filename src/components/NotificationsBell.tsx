import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// This is a placeholder public key. The real one must be stored in env or DB.
const PUBLIC_VAPID_KEY = "BJthRQ5myDgc7OSXzPCMftGw-n16F7zQBEN7EHM6kbnEzyQYk_6K518C1D-HqT9t9T-gXoM2Y3J9r2X-hO-9Xxw";

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationsBell = ({ className }: { className?: string }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error("Error checking push subscription:", e);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    if (!("serviceWorker" in navigator)) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY),
        });
      }

      // Save to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      const subJSON = subscription.toJSON();
      await supabase.from("push_subscriptions").upsert({
        user_id: session?.user?.id || null, // Allow anon if user_id is nullable
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
      }, { onConflict: 'endpoint' });

      setIsSubscribed(true);
      toast.success("Notifications activées !");
    } catch (e) {
      console.error("Push subscription error:", e);
      toast.error("Impossible d'activer les notifications.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
      
      setIsSubscribed(false);
      toast.info("Notifications désactivées.");
    } catch (e) {
      console.error("Push unsubscription error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null; // Don't show button if push is not supported
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
        isSubscribed 
          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
          : "bg-muted text-muted-foreground border-border hover:text-foreground",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell className="h-4 w-4" /> Activées
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" /> S'abonner
        </>
      )}
    </button>
  );
};
