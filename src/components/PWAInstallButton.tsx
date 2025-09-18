"use client";

import { Smartphone } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { usePWA } from "@/hooks/usePWA";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "secondary" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PWAInstallButton({
  variant = "outline",
  size = "sm",
  className
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isStandalone, prompt } = usePWA();

  // Don't show button if already installed or running in standalone mode
  if (isInstalled || isStandalone || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (prompt) {
      await prompt();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={className}
    >
      <Smartphone className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}