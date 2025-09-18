import { cn } from "@/lib/utils";
import React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-secondary border-2 border-black shadow-md animate-pulse rounded-none",
        className
      )}
      {...props}
    />
  );
}