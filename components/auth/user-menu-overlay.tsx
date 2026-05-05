"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronLeft, LogOut, Settings2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthOverlayFrame } from "@/components/auth/auth-overlay-frame";
import { SettingsSections } from "@/components/settings-sections";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/types";

type UserMenuOverlayProps = {
  locale: Locale;
  onClose: () => void;
};

export function UserMenuOverlay({ locale, onClose }: UserMenuOverlayProps) {
  const t = getTranslator(locale);
  const router = useRouter();
  const clerk = useClerk();
  const { user } = useUser();
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    try {
      await clerk.signOut({ redirectUrl: "/" });
      onClose();
      router.refresh();
    } catch {
      toast.error(t("auth.errors.signOutFailed"));
    }
  };

  const displayName = user?.fullName || user?.username || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const imageUrl = user?.imageUrl || "";

  return (
    <AuthOverlayFrame onClose={onClose} className="max-w-lg">
      <div className="overflow-hidden rounded-[24px] border border-border bg-surface-raised">
        <div className="flex items-center gap-4 border-b border-border px-5 py-5">
          {showSettings ? (
            <button
              type="button"
              aria-label="Back"
              onClick={() => setShowSettings(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <img
              src={imageUrl}
              alt={displayName}
              className="size-14 rounded-full border border-border bg-surface-subtle"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        {showSettings ? (
          <div className="max-h-[60vh] overflow-y-auto bg-surface-warm p-5">
            <SettingsSections
              locale={locale}
              imageUrl={imageUrl}
              name={displayName}
              email={email}
              showAvatar={false}
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-foreground transition-colors hover:bg-surface-subtle"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("settings.manageAccount")}</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-foreground transition-colors hover:bg-surface-subtle"
              onClick={handleSignOut}
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("settings.signOut")}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("auth.common.close")}
        </Button>
      </div>
    </AuthOverlayFrame>
  );
}
