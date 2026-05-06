import { useState, useEffect } from "react";
import { toast } from "sonner";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Votre navigateur ne supporte pas les notifications.");
      return false;
    }

    const res = await Notification.requestPermission();
    setPermission(res);
    
    if (res === "granted") {
      toast.success("Notifications activées !");
      // Here you would register the subscription with your backend
      return true;
    } else {
      toast.error("Notifications refusées.");
      return false;
    }
  };

  return { permission, requestPermission };
}
