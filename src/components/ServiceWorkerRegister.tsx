"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js (offline support) in production builds.
 * Not in development: a caching worker would get in the way of hot reload.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Files this page loaded before the worker existed (first visit) are saved now.
        const urls = [
          location.pathname,
          ...performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => url.startsWith(location.origin)),
        ];
        registration.active?.postMessage({ type: "cache-urls", urls });
      })
      .catch(() => {
        // Offline support is a bonus; the app works without it.
      });
  }, []);

  return null;
}
