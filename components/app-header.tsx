"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenuOverlay } from "@/components/auth/user-menu-overlay";
import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Locale } from "@/types";

export function AppHeader({ locale }: { locale: Locale }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSignedIn = isLoaded && Boolean(userId);
  const t = getTranslator(locale);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up" | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const redirectTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const displayName = user?.fullName || user?.username || "User";
  const imageUrl = user?.imageUrl || "";

  useEffect(() => {
    const handleOpenAuth = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: "sign-in" | "sign-up"; redirectTo?: string }>).detail;
      setAuthMode(detail?.mode ?? "sign-in");
    };

    window.addEventListener("cli-dojo:open-auth", handleOpenAuth as EventListener);

    return () => {
      window.removeEventListener("cli-dojo:open-auth", handleOpenAuth as EventListener);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 shadow-sm bg-surface-warm/95 backdrop-blur supports-[backdrop-filter]:bg-surface-warm/95">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link className="font-mono text-lg font-semibold tracking-normal" href="/">
            CLI Dojo
          </Link>
          <span className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground sm:hidden">
            MVP
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild size="sm" variant={pathname === "/" ? "outline" : "ghost"}>
            <Link href="/">{t("nav.home")}</Link>
          </Button>
          {isSignedIn ? (
            <Button asChild size="sm" variant={pathname === "/progress" ? "outline" : "ghost"}>
              <Link href="/progress">{t("nav.progress")}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAuthMode("sign-in")}
            >
              {t("nav.progress")}
            </Button>
          )}
          {isSignedIn ? (
            <>
              <button
                type="button"
                aria-label={t("nav.settings")}
                onClick={() => setIsUserMenuOpen(true)}
                className="ml-1 rounded-full border border-border bg-surface-raised text-muted-foreground transition-colors hover:text-foreground"
              >
                <UserAvatar
                  imageUrl={imageUrl}
                  name={displayName}
                  className="size-9 border-0"
                  sizes="36px"
                />
              </button>
            </>
          ) : null}
          {isLoaded && !isSignedIn ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full px-4"
                onClick={() => setAuthMode("sign-in")}
              >
                {t("nav.signIn")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="rounded-full px-4 hover:bg-primary/90"
                onClick={() => setAuthMode("sign-up")}
              >
                {t("nav.signUp")}
              </Button>
            </>
          ) : null}
        </nav>
      </div>
      </header>

      {authMode ? (
        <AuthModal
          locale={locale}
          mode={authMode}
          redirectTo={redirectTo}
          onClose={() => setAuthMode(null)}
        />
      ) : null}

      {isSignedIn && isUserMenuOpen ? (
        <UserMenuOverlay locale={locale} onClose={() => setIsUserMenuOpen(false)} />
      ) : null}
    </>
  );
}
