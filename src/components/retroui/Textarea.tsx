import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "px-4 py-2 w-full border-2 border-black shadow-md transition-all font-head",
        "focus:outline-none focus:shadow-none focus:translate-y-0.5",
        "hover:shadow-sm placeholder:text-muted-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "resize-none rounded-none bg-background",
        className
      )}
      {...props}
    />
  );
}
