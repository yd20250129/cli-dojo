"use client";

import { Loader2, Mail, MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useClerk, useSignUp } from "@clerk/nextjs";

import { AuthPanelCard } from "@/components/auth/auth-panel-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/types";

type SignUpPanelProps = {
  locale: Locale;
  redirectTo?: string;
  onSwitchToSignIn?: () => void;
  onSuccess?: () => void;
};

type SignUpStep = "identifier" | "code";
type SocialOAuthStrategy = "oauth_github" | "oauth_google";
type SocialSettings = Partial<Record<SocialOAuthStrategy, { authenticatable?: boolean }>>;

function getClerkErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "errors" in error) {
    const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    const message = errors?.[0]?.longMessage || errors?.[0]?.message;
    if (message) {
      return message;
    }
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) {
      return message;
    }
  }

  return fallback;
}

function isAlreadyVerifiedError(error: unknown) {
  if (typeof error !== "object" || !error || !("errors" in error)) {
    return false;
  }

  const errors = (error as { errors?: Array<{ code?: string; longMessage?: string; message?: string }> }).errors;
  const code = errors?.[0]?.code;
  const message = `${errors?.[0]?.longMessage ?? ""} ${errors?.[0]?.message ?? ""}`.toLowerCase();

  return code === "form_code_already_verified" || message.includes("already been verified");
}

function formatPendingFields(fields: string[]) {
  return fields
    .map((field) => field.replaceAll("_", " "))
    .filter(Boolean)
    .join(", ");
}

const SOCIAL_OAUTH_PROVIDERS: Array<{ strategy: SocialOAuthStrategy; label: string }> = [
  { strategy: "oauth_github", label: "GitHub" },
  { strategy: "oauth_google", label: "Google" },
];

function getSocialSettings() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { Clerk?: { userSettings?: { social?: SocialSettings } } }).Clerk?.userSettings?.social;
}

export function SignUpPanel({
  locale,
  redirectTo = "/auth/sign-up-complete",
  onSwitchToSignIn,
  onSuccess,
}: SignUpPanelProps) {
  const router = useRouter();
  const t = getTranslator(locale);
  const clerk = useClerk();
  const { signUp } = useSignUp();
  const [step, setStep] = useState<SignUpStep>("identifier");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<SocialOAuthStrategy | null>(null);
  const socialSettings = clerk.loaded ? getSocialSettings() : undefined;
  const availableSocialProviders = clerk.loaded
    ? SOCIAL_OAUTH_PROVIDERS.filter(
        ({ strategy }) => socialSettings?.[strategy]?.authenticatable,
      )
    : [];

  const canAuthenticateWithStrategy = (strategy: SocialOAuthStrategy) =>
    Boolean(socialSettings?.[strategy]?.authenticatable);

  const getProviderLabel = (strategy: SocialOAuthStrategy) =>
    SOCIAL_OAUTH_PROVIDERS.find((provider) => provider.strategy === strategy)?.label ?? strategy;

  const finalizeSignUp = async () => {
    if (!signUp) {
      return false;
    }

    if (signUp.status !== "complete" || !signUp.createdSessionId) {
      const pendingFields = formatPendingFields([
        ...signUp.missingFields,
        ...signUp.unverifiedFields,
      ]);

      setError(
        pendingFields
          ? t("auth.errors.signUpIncompleteWithFields", { fields: pendingFields })
          : t("auth.errors.signUpIncomplete"),
      );
      return false;
    }

    const finalizeResult = await signUp.finalize();
    if (finalizeResult.error) {
      setError(finalizeResult.error.message || t("auth.errors.signUpFailed"));
      return false;
    }

    router.refresh();
    onSuccess?.();
    router.push(redirectTo);
    return true;
  };

  const handleStartEmailCode = async () => {
    if (!signUp) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const createParams = {
        emailAddress: email.trim(),
        password: password.trim(),
      };
      const createResult = await signUp.create(createParams);
      if (createResult.error) {
        setError(createResult.error.message || t("auth.errors.signUpFailed"));
        return;
      }

      const sendCodeResult = await signUp.verifications.sendEmailCode();
      if (sendCodeResult.error) {
        setError(sendCodeResult.error.message || t("auth.errors.signUpFailed"));
        return;
      }

      setStep("code");
    } catch (signUpError) {
      setError(getClerkErrorMessage(signUpError, t("auth.errors.signUpFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signUp) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const verifyCodeResult = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verifyCodeResult.error && !isAlreadyVerifiedError(verifyCodeResult.error)) {
        setError(verifyCodeResult.error.message || t("auth.errors.invalidCode"));
        return;
      }

      await finalizeSignUp();
    } catch (signUpError) {
      if (isAlreadyVerifiedError(signUpError)) {
        const finalized = await finalizeSignUp();
        if (finalized) {
          return;
        }
      } else {
        setError(getClerkErrorMessage(signUpError, t("auth.errors.invalidCode")));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (strategy: SocialOAuthStrategy) => {
    const legacySignUp = clerk.client?.signUp;
    if (!legacySignUp) {
      return;
    }

    if (!canAuthenticateWithStrategy(strategy)) {
      setError(
        t("auth.errors.oauthProviderUnavailable", {
          provider: getProviderLabel(strategy),
        }),
      );
      return;
    }

    setError("");
    setIsSocialLoading(strategy);

    try {
      await legacySignUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: redirectTo,
        continueSignUp: true,
      });
    } catch (signUpError) {
      setError(getClerkErrorMessage(signUpError, t("auth.errors.oauthFailed")));
      setIsSocialLoading(null);
    }
  };

  return (
    <AuthPanelCard
      locale={locale}
      title={t("auth.signUp.title")}
      description={t("auth.signUp.description")}
      footer={
        step === "identifier" && onSwitchToSignIn ? (
          <>
            {t("auth.signUp.footerPrefix")}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={onSwitchToSignIn}
            >
              {t("auth.signUp.footerLink")}
            </button>
          </>
        ) : null
      }
    >
      <div className="space-y-5">
        {availableSocialProviders.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableSocialProviders.map((provider) => (
                <Button
                  key={provider.strategy}
                  type="button"
                  variant="outline"
                  className="h-12 justify-center rounded-2xl border-border bg-surface-raised text-foreground"
                  onClick={() => handleOAuth(provider.strategy)}
                  disabled={Boolean(isSocialLoading) || isSubmitting}
                >
                  {isSocialLoading === provider.strategy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{provider.label}</span>
                  )}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>{t("auth.common.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        {step === "identifier" ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">
                {t("auth.common.emailLabel")}
              </span>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("auth.common.emailPlaceholder")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl px-4"
                disabled={isSubmitting || Boolean(isSocialLoading)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">
                {t("auth.common.passwordLabel")}
              </span>
              <PasswordInput
                locale={locale}
                autoComplete="new-password"
                placeholder={t("auth.common.passwordPlaceholder")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl px-4"
                disabled={isSubmitting || Boolean(isSocialLoading)}
              />
            </label>

            {error ? <p className="text-sm text-status-error">{error}</p> : null}

            <Button
              type="button"
              className="h-12 w-full rounded-2xl bg-primary text-base text-primary-foreground hover:bg-primary/90"
              onClick={handleStartEmailCode}
              disabled={
                !signUp ||
                !email.trim() ||
                !password.trim() ||
                isSubmitting ||
                Boolean(isSocialLoading)
              }
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {t("auth.common.continue")}
            </Button>

            <div
              id="clerk-captcha"
              className="min-h-10"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-status-warning/30 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
              {t("auth.signUp.codeSent", { email })}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">
                {t("auth.common.codeLabel")}
              </span>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("auth.common.codePlaceholder")}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="h-12 rounded-2xl px-4 tracking-[0.3em]"
                disabled={isSubmitting}
              />
            </label>

            {error ? <p className="text-sm text-status-error">{error}</p> : null}

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
              <Button
                type="button"
                className="h-12 min-w-0 w-full rounded-2xl bg-primary text-base text-primary-foreground hover:bg-primary/90 sm:justify-center"
                onClick={handleVerifyCode}
                disabled={!signUp || !code.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MoveRight className="size-4" />}
                {t("auth.common.verifyCode")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl sm:w-auto"
                onClick={() => {
                  setStep("identifier");
                  setCode("");
                  setError("");
                }}
                disabled={isSubmitting}
              >
                {t("auth.common.changeEmail")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthPanelCard>
  );
}
