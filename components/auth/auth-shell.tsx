import Link from "next/link";
import type { ReactNode } from "react";

import { getTranslator } from "@/lib/i18n";
import { AUTH_METHODS } from "@/lib/shared/auth-methods";
import type { Locale } from "@/types";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  footer: ReactNode;
  locale: Locale;
};

export function AuthShell({ children, title, description, footer, locale }: AuthShellProps) {
  const t = getTranslator(locale);

  return (
    <main className="min-h-screen bg-surface-page px-4 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{t("auth.eyebrow")}</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
            <div className="flex flex-wrap gap-2">
              {AUTH_METHODS.map((provider) => (
                <span
                  key={provider}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-sm font-medium text-text-secondary"
                >
                  {provider}
                </span>
              ))}
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          </div>
          <div className="pt-4 text-sm text-muted-foreground">
            <Link className="font-medium text-foreground underline underline-offset-4" href="/">
              {t("auth.backHome")}
            </Link>
          </div>
        </section>
        <section className="flex justify-center">
          <div className="flex w-full max-w-md flex-col items-center space-y-4">
            {children}
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
