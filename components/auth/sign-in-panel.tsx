"use client";

import { Loader2, Mail, MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useClerk, useSignIn } from "@clerk/nextjs";

import { AuthPanelCard } from "@/components/auth/auth-panel-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getTranslator } from "@/lib/i18n";
import type { Locale } from "@/types";

type SignInPanelProps = {
  locale: Locale;
  redirectTo?: string;
  onSwitchToSignUp?: () => void;
  onSuccess?: () => void;
};

type SignInStep = "identifier" | "code";
type CodeStepMode = "email_first_factor" | "email_second_factor";

type FactorListState = {
  status?: string | null;
  supportedFirstFactors?: Array<{ strategy: string }> | null;
  supportedSecondFactors?: Array<{ strategy: string }> | null;
};

type EmailCodeFactorState = {
  strategy: "email_code";
  emailAddressId: string;
  safeIdentifier: string;
};

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

function formatSupportedFactors(factors: Array<{ strategy: string }> | null | undefined) {
  return (factors ?? [])
    .map((factor) => factor.strategy.replaceAll("_", " "))
    .filter(Boolean)
    .join(", ");
}

function getIncompleteFactorMessage(resource: FactorListState, fallback: string) {
  const supportedFactors =
    resource.status === "needs_second_factor"
      ? formatSupportedFactors(resource.supportedSecondFactors)
      : formatSupportedFactors(resource.supportedFirstFactors);

  return supportedFactors
    ? fallback.replace("{{factors}}", supportedFactors)
    : "";
}

export function SignInPanel({
  locale,
  redirectTo = "/",
  onSwitchToSignUp,
  onSuccess,
}: SignInPanelProps) {
  const router = useRouter();
  const t = getTranslator(locale);
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [step, setStep] = useState<SignInStep>("identifier");
  const [codeStepMode, setCodeStepMode] = useState<CodeStepMode>("email_first_factor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [safeIdentifier, setSafeIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"oauth_github" | "oauth_google" | null>(null);

  const completeSignIn = () => {
    router.refresh();
    onSuccess?.();
    if (redirectTo !== "/") {
      router.push(redirectTo);
    }
  };

  const transitionToEmailCodeStep = (identifier: string, mode: CodeStepMode) => {
    setSafeIdentifier(identifier);
    setCode("");
    setCodeStepMode(mode);
    setStep("code");
  };

  const resetCodeStep = () => {
    void signIn?.reset();
    setStep("identifier");
    setCode("");
    setError("");
    setSafeIdentifier("");
    setCodeStepMode("email_first_factor");
  };

  const beginSecondFactorEmailCode = async (
    signInAttempt: {
      status: string | null;
      createdSessionId: string | null;
      supportedFirstFactors: Array<{ strategy: string }> | null;
      supportedSecondFactors: Array<{ strategy: string }> | null;
      prepareSecondFactor: (params: { strategy: "email_code"; emailAddressId?: string }) => Promise<{
        status: string | null;
        createdSessionId: string | null;
        supportedFirstFactors: Array<{ strategy: string }> | null;
        supportedSecondFactors: Array<{ strategy: string }> | null;
      }>;
    },
    fallbackIdentifier: string,
  ) => {
    const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
      (factor): factor is EmailCodeFactorState => factor.strategy === "email_code",
    );

    if (!emailCodeFactor) {
      const incompleteMessage = getIncompleteFactorMessage(
        signInAttempt,
        t("auth.errors.signInIncompleteWithFactors", { factors: "{{factors}}" }),
      );
      setError(incompleteMessage || t("auth.errors.signInIncomplete"));
      return false;
    }

    const preparedSignIn = await signInAttempt.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailCodeFactor.emailAddressId,
    });

    if (preparedSignIn.status === "complete" && preparedSignIn.createdSessionId) {
      await clerk.setActive({ session: preparedSignIn.createdSessionId });
      completeSignIn();
      return true;
    }

    transitionToEmailCodeStep(emailCodeFactor.safeIdentifier || fallbackIdentifier, "email_second_factor");
    return true;
  };

  const finalizeSignIn = async () => {
    if (!signIn) {
      return false;
    }

    if (signIn.status !== "complete" || !signIn.createdSessionId) {
      const incompleteMessage = getIncompleteFactorMessage(
        signIn,
        t("auth.errors.signInIncompleteWithFactors", { factors: "{{factors}}" }),
      );
      setError(incompleteMessage || t("auth.errors.signInIncomplete"));
      return false;
    }

    const finalizeResult = await signIn.finalize();
    if (finalizeResult.error) {
      setError(finalizeResult.error.message || t("auth.errors.signInFailed"));
      return false;
    }

    completeSignIn();
    return true;
  };

  const handleStartEmailCode = async () => {
    if (!signIn) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current ?? undefined);
      const submittedEmail = String(formData.get("email") ?? email).trim();
      const submittedPassword = String(formData.get("password") ?? password).trim();

      const createResult = await signIn.create({ identifier: submittedEmail });
      if (createResult.error) {
        setError(createResult.error.message || t("auth.errors.signInFailed"));
        return;
      }

      if (submittedPassword) {
        const legacySignIn = clerk.client?.signIn;
        if (!legacySignIn) {
          setError(t("auth.errors.signInFailed"));
          return;
        }

        const passwordAttempt = await legacySignIn.create({ identifier: submittedEmail });
        const completedSignIn = await passwordAttempt.attemptFirstFactor({
          strategy: "password",
          password: submittedPassword,
        });

        if (completedSignIn.status === "needs_second_factor") {
          await beginSecondFactorEmailCode(completedSignIn, submittedEmail);
          return;
        }

        if (completedSignIn.status !== "complete" || !completedSignIn.createdSessionId) {
          const incompleteMessage = getIncompleteFactorMessage(
            completedSignIn,
            t("auth.errors.signInIncompleteWithFactors", { factors: "{{factors}}" }),
          );
          setError(incompleteMessage || t("auth.errors.signInIncomplete"));
          return;
        }

        await clerk.setActive({ session: completedSignIn.createdSessionId });
        completeSignIn();
        return;
      }

      const sendCodeResult = await signIn.emailCode.sendCode({ emailAddress: submittedEmail });
      if (sendCodeResult.error) {
        setError(sendCodeResult.error.message || t("auth.errors.emailCodeUnavailable"));
        return;
      }

      setSafeIdentifier(submittedEmail);
      setCode("");
      setCodeStepMode("email_first_factor");
      setStep("code");
    } catch (signInError) {
      setError(getClerkErrorMessage(signInError, t("auth.errors.signInFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signIn) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (codeStepMode === "email_second_factor") {
        const legacySignIn = clerk.client?.signIn;
        if (!legacySignIn) {
          setError(t("auth.errors.signInFailed"));
          return;
        }

        const secondFactorResult = await legacySignIn.attemptSecondFactor({
          strategy: "email_code",
          code: code.trim(),
        });

        if (secondFactorResult.status !== "complete" || !secondFactorResult.createdSessionId) {
          const incompleteMessage = getIncompleteFactorMessage(
            secondFactorResult,
            t("auth.errors.signInIncompleteWithFactors", { factors: "{{factors}}" }),
          );
          setError(incompleteMessage || t("auth.errors.invalidCode"));
          return;
        }

        await clerk.setActive({ session: secondFactorResult.createdSessionId });
        completeSignIn();
        return;
      }

      const verifyCodeResult = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (verifyCodeResult.error) {
        setError(verifyCodeResult.error.message || t("auth.errors.invalidCode"));
        return;
      }

      if (signIn.status === "needs_second_factor") {
        const legacySignIn = clerk.client?.signIn;
        if (!legacySignIn) {
          setError(t("auth.errors.signInFailed"));
          return;
        }

        await beginSecondFactorEmailCode(legacySignIn, safeIdentifier || email);
        return;
      }

      await finalizeSignIn();
    } catch (signInError) {
      setError(getClerkErrorMessage(signInError, t("auth.errors.invalidCode")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_github" | "oauth_google") => {
    const legacySignIn = clerk.client?.signIn;
    if (!legacySignIn) {
      return;
    }

    setError("");
    setIsSocialLoading(strategy);

    try {
      await legacySignIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: redirectTo,
        continueSignIn: true,
      });
    } catch (signInError) {
      setError(getClerkErrorMessage(signInError, t("auth.errors.oauthFailed")));
      setIsSocialLoading(null);
    }
  };

  return (
    <AuthPanelCard
      locale={locale}
      title={t("auth.signIn.title")}
      description={t("auth.signIn.description")}
      footer={
        onSwitchToSignUp ? (
          <>
            {t("auth.signIn.footerPrefix")}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={onSwitchToSignUp}
            >
              {t("auth.signIn.footerLink")}
            </button>
          </>
        ) : null
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-center rounded-2xl border-border bg-surface-raised text-foreground"
            onClick={() => handleOAuth("oauth_github")}
            disabled={Boolean(isSocialLoading) || isSubmitting}
          >
            {isSocialLoading === "oauth_github" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="text-sm font-medium">GitHub</span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-center rounded-2xl border-border bg-surface-raised text-foreground"
            onClick={() => handleOAuth("oauth_google")}
            disabled={Boolean(isSocialLoading) || isSubmitting}
          >
            {isSocialLoading === "oauth_google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="text-sm font-medium">Google</span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{t("auth.common.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {step === "identifier" ? (
          <form ref={formRef} className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">
                {t("auth.common.emailLabel")}
              </span>
              <Input
                name="email"
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
                name="password"
                locale={locale}
                autoComplete="current-password"
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
              className="h-12 w-full rounded-2xl bg-foreground text-base text-background hover:bg-foreground/90"
              onClick={handleStartEmailCode}
              disabled={!signIn || !email.trim() || isSubmitting || Boolean(isSocialLoading)}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {t("auth.common.continue")}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-status-success-border bg-status-success-bg px-4 py-3 text-sm text-status-success-text-strong">
              {t("auth.signIn.codeSent", { email: safeIdentifier || email })}
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
                className="h-12 min-w-0 w-full rounded-2xl bg-foreground text-base text-background hover:bg-foreground/90 sm:justify-center"
                onClick={handleVerifyCode}
                disabled={!signIn || !code.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MoveRight className="size-4" />}
                {t("auth.common.verifyCode")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl sm:w-auto"
                onClick={resetCodeStep}
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
