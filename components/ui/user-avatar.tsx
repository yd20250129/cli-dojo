"use client";

import Image from "next/image";
import { UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
  imageUrl?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
  sizes?: string;
};

export function UserAvatar({
  imageUrl,
  name,
  className,
  iconClassName,
  sizes = "64px",
}: UserAvatarProps) {
  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full border border-border bg-surface-subtle text-muted-foreground",
          className,
        )}
      >
        <UserCircle2 className={cn("size-full", iconClassName)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-border bg-surface-subtle",
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        unoptimized
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
