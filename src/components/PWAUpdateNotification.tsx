"use client";

import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useState } from "react";

export function PWAUpdateNotification() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              App Update Available
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              A new version of Retrofy is ready to install.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="text-xs"
              >
                Update Now
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={handleDismiss}
                className="text-xs"
              >
                Later
              </Button>
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}