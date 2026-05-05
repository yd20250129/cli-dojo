"use client";

import { useMemo, useState } from "react";

import { AuthOverlayFrame } from "@/components/auth/auth-overlay-frame";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { SignUpPanel } from "@/components/auth/sign-up-panel";
import type { Locale } from "@/types";

type AuthMode = "sign-in" | "sign-up";

type AuthModalProps = {
  locale: Locale;
  mode: AuthMode;
  redirectTo?: string;
  onClose: () => void;
};

export function AuthModal({ locale, mode, redirectTo, onClose }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const normalizedRedirect = useMemo(() => {
    if (!redirectTo || redirectTo === "/sign-in" || redirectTo === "/sign-up") {
      return "/";
    }
    return redirectTo;
  }, [redirectTo]);

  return (
    <AuthOverlayFrame onClose={onClose} className="max-w-3xl">
      {currentMode === "sign-in" ? (
        <SignInPanel
          locale={locale}
          redirectTo={normalizedRedirect}
          onSwitchToSignUp={() => setCurrentMode("sign-up")}
          onSuccess={onClose}
        />
      ) : (
        <SignUpPanel
          locale={locale}
          onSwitchToSignIn={() => setCurrentMode("sign-in")}
          onSuccess={onClose}
        />
      )}
    </AuthOverlayFrame>
  );
}
