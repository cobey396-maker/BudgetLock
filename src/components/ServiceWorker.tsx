"use client";
import { useEffect } from "react";

// Registers the offline cache. A service worker with a fetch handler is also
// what makes the app installable on Android/desktop Chrome; iOS installs from
// the manifest alone but still benefits from the offline shell.
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((e) => console.warn("[budgetlock] service worker registration failed", e));
    };

    // Wait for load so registration never competes with first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
