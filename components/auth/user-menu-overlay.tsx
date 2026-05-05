"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings2 } from "lucide-react";
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
    <AuthOverlayFrame onClose={onClose} className="max-w-4xl">
      <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
        <div className="flex items-center gap-4 border-b border-zinc-200 px-5 py-5">
          <img
            src={imageUrl}
            alt={displayName}
            className="size-14 rounded-full border border-zinc-200 bg-zinc-100"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-zinc-950">{displayName}</p>
            <p className="truncate text-sm text-zinc-500">{email}</p>
          </div>
        </div>

        <div className="grid border-b border-zinc-200 sm:grid-cols-2">
          <button
            type="button"
            className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 text-left text-zinc-800 transition-colors hover:bg-zinc-50 sm:border-b-0 sm:border-r"
          >
            <Settings2 className="size-4 text-zinc-500" />
            <span className="text-sm font-medium">{t("settings.manageAccount")}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-3 px-5 py-4 text-left text-zinc-800 transition-colors hover:bg-zinc-50"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 text-zinc-500" />
            <span className="text-sm font-medium">{t("settings.signOut")}</span>
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto bg-[#fcfaf4] p-5">
          <SettingsSections
            locale={locale}
            imageUrl={imageUrl}
            name={displayName}
            email={email}
            showAvatar={false}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("auth.common.close")}
        </Button>
      </div>
    </AuthOverlayFrame>
  );
}
