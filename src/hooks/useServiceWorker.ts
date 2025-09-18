"use client";

import { useEffect, useState } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  updateServiceWorker: () => void;
}

export function useServiceWorker(): ServiceWorkerState {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if service workers are supported
    const supported = "serviceWorker" in navigator;
    setIsSupported(supported);

    if (!supported) return;

    // Check if service worker is already registered
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        setIsRegistered(true);
        setRegistration(reg);

        // Check for updates
        checkForUpdates(reg);
      }
    });

    // Listen for service worker registration
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      setIsRegistered(true);
    });

    // Listen for service worker updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SW_UPDATE_AVAILABLE") {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const checkForUpdates = (reg: ServiceWorkerRegistration) => {
    if (reg.waiting) {
      setUpdateAvailable(true);
      return;
    }

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      }
    });
  };

  const updateServiceWorker = () => {
    if (!registration?.waiting) return;

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Reload the page to use the new service worker
    window.location.reload();
  };

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    registration,
    updateServiceWorker,
  };
}