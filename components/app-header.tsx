"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UserCircle2 } from "lucide-react";

import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenuOverlay } from "@/components/auth/user-menu-overlay";
import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/types";

export function AppHeader({ locale }: { locale: Locale }) {
  const { isLoaded, userId } = useAuth();
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
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f6f1e3]/90 backdrop-blur supports-[backdrop-filter]:bg-[#f6f1e3]/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link className="font-mono text-lg font-semibold tracking-normal" href="/">
            CLI Dojo
          </Link>
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600 sm:hidden">
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
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsUserMenuOpen(true)}
              >
                {t("nav.settings")}
              </Button>
              <button
                type="button"
                aria-label={t("nav.settings")}
                onClick={() => setIsUserMenuOpen(true)}
                className="ml-1 rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <UserCircle2 className="size-9" />
              </button>
            </>
          ) : null}
          {isLoaded && !isSignedIn ? (
            <>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-500"
                onClick={() => setAuthMode("sign-in")}
              >
                {t("nav.signIn")}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#ef7d32] px-4 text-white hover:bg-[#df6d20]"
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
