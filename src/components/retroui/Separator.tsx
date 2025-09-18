import { cn } from "@/lib/utils";
import React from "react";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "bg-border border-2 border-black shadow-sm shrink-0",
        orientation === "horizontal" ? "h-1 w-full" : "h-full w-1",
        className
      )}
      {...props}
    />
  );
}