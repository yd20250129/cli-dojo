import type { LoginMethod } from "@/types";

export const AUTH_METHODS = ["Email", "GitHub", "Google"] as const;

export const AUTH_METHOD_LABEL = AUTH_METHODS.join(" / ");

type ClerkExternalAccount = {
  provider?: string | null;
};

type ClerkUserLike = {
  passwordEnabled?: boolean;
  externalAccounts?: ClerkExternalAccount[];
};

export function resolveLoginMethod(
  user: ClerkUserLike | null | undefined,
): LoginMethod {
  if (!user) {
    return "unknown";
  }

  if (user.passwordEnabled) {
    return "email";
  }

  const providers = new Set(
    (user.externalAccounts ?? [])
      .map((account) => account.provider?.toLowerCase())
      .filter((provider): provider is string => Boolean(provider)),
  );

  if (providers.has("google")) {
    return "google";
  }

  if (providers.has("github")) {
    return "github";
  }

  return "unknown";
}
