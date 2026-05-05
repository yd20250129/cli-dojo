"use client";

import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { SettingsSections } from "@/components/settings-sections";
import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/types";

type SettingsViewProps = {
  locale: Locale;
  imageUrl: string;
  name: string;
  email: string;
};

export function SettingsView({ locale, imageUrl, name: initialName, email }: SettingsViewProps) {
  const t = getTranslator(locale);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 pb-8">
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-sm uppercase tracking-wide text-zinc-500">
              {t("settings.eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {t("settings.title")}
            </h1>
          </div>
        </div>

        <SettingsSections locale={locale} imageUrl={imageUrl} name={initialName} email={email} />
      </main>

      <div className="mt-4 flex justify-center">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/">{t("app.common.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
