"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthOverlayFrameProps = {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

export function AuthOverlayFrame({ children, onClose, className }: AuthOverlayFrameProps) {
  useEffect(() => {
    if (!onClose) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!onClose) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/45 px-4 py-8 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-surface-warm-border bg-surface-warm shadow-[0_24px_80px_rgba(24,24,27,0.18)]",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex justify-end bg-gradient-to-b from-surface-warm via-surface-warm to-transparent px-4 pt-4">
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-full border border-border bg-surface-raised p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">{children}</div>
      </div>
    </div>
  );
}
