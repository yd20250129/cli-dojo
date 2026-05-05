"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

import { Input } from "./input";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  locale: Locale;
};

export function PasswordInput({ className, locale, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const t = getTranslator(locale);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-14", className)}
        {...props}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-900"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? t("auth.common.hidePassword") : t("auth.common.showPassword")}
        title={isVisible ? t("auth.common.hidePassword") : t("auth.common.showPassword")}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
