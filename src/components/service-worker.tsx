"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const goOffline = () => { setOffline(true); setShowBanner(true); };
    const goOnline = () => { setOffline(false); setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    if (!navigator.onLine) goOffline();

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!showBanner && !offline) return null;

  return (
    <div style={{
      position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10000,
      padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
      fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
      background: offline ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
      border: `1px solid ${offline ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
      color: offline ? "#ef4444" : "#22c55e",
      backdropFilter: "blur(12px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      transition: "opacity 0.3s, transform 0.3s",
      opacity: 1,
    }}>
      {offline ? <WifiOff size={14} /> : <Wifi size={14} />}
      {offline ? "You're offline — changes will sync when reconnected" : "Back online"}
    </div>
  );
}
