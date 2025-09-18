import { cn } from "@/lib/utils";
import React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "relative overflow-auto border-2 border-black shadow-md bg-background",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}