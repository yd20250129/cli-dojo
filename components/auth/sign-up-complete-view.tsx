"use client";

import { useAuth } from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearAnonymousProgress,
  getAnonymousProgressState,
} from "@/lib/client/anonymous-progress";
import { migrateAnonymousProgress } from "@/lib/client/api";
import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Locale, MigrateProgressResult } from "@/types";

let pendingMigration: Promise<MigrateProgressResult> | null = null;
let pendingMigrationUserId: string | null = null;
let completedMigrationUserId: string | null = null;

type SignUpCompleteViewProps = {
  locale: Locale;
};

export function SignUpCompleteView({ locale }: SignUpCompleteViewProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const t = getTranslator(locale);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      router.replace("/sign-up");
      return;
    }

    const anonymousProgress = getAnonymousProgressState();
    const hasAnonymousProgress = Object.values(anonymousProgress).some(
      (section) => Object.keys(section?.answers ?? {}).length > 0,
    );

    if (!hasAnonymousProgress) {
      clearAnonymousProgress();
      router.replace("/");
      return;
    }

    if (completedMigrationUserId === userId) {
      clearAnonymousProgress();
      router.replace("/progress");
      return;
    }

    if (!pendingMigration || pendingMigrationUserId !== userId) {
      pendingMigration = migrateAnonymousProgress(anonymousProgress);
      pendingMigrationUserId = userId;
    }

    let active = true;

    pendingMigration
      .then((result) => {
        if (!active) {
          return;
        }

        pendingMigration = null;
        pendingMigrationUserId = null;

        if (result.reason === "no_anonymous_progress") {
          clearAnonymousProgress();
          router.replace("/");
          return;
        }

        if (result.migrated || result.reason === "account_progress_exists") {
          completedMigrationUserId = userId;
          clearAnonymousProgress();
          router.replace("/progress");
          return;
        }

        setError(t("auth.signUpComplete.errors.migrationFailed"));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        pendingMigration = null;
        pendingMigrationUserId = null;
        setError(t("auth.signUpComplete.errors.migrationFailed"));
      });

    return () => {
      active = false;
    };
  }, [isLoaded, router, t, userId]);

  return (
    <Card className="w-full rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle>{t("auth.signUpComplete.cardTitle")}</CardTitle>
        <CardDescription>{t("auth.signUpComplete.cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-zinc-600">
            <LoaderCircle className="size-4 animate-spin" />
            {t("auth.signUpComplete.loading")}
          </p>
        )}
      </CardContent>
      {error ? (
        <CardFooter className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">{t("app.common.backHome")}</Link>
          </Button>
          <Button asChild>
            <Link href="/progress">{t("nav.progress")}</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
