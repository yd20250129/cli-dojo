"use client";

import { getTranslator } from "@/lib/i18n";
import { AUTH_METHODS } from "@/lib/shared/auth-methods";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

type AuthPanelCardProps = {
  locale: Locale;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthPanelCard({
  locale,
  title,
  description,
  children,
  footer,
  className,
}: AuthPanelCardProps) {
  const t = getTranslator(locale);

  return (
    <div
      className={cn(
        "rounded-[28px] border border-zinc-200 bg-white/92 p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)] sm:p-6",
        className,
      )}
    >
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-zinc-500">
          {t("auth.eyebrow")}
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            {title}
          </h2>
          <p className="text-sm leading-7 text-zinc-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AUTH_METHODS.map((provider) => (
            <span
              key={provider}
              className="rounded-full border border-zinc-200 bg-[#faf7ef] px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {provider}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">{children}</div>

      {footer ? <div className="mt-5 text-center text-sm text-zinc-600">{footer}</div> : null}
    </div>
  );
}
