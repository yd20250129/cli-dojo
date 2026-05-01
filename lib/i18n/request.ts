import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import {
  defaultLocale,
  defaultUserPreferences,
  isCurrency,
  isLocale,
  isRegion,
  localeCookieName,
} from "@/lib/i18n/config";
import { getOrCreateAccount } from "@/lib/server/accounts-repository";
import { getCurrentUserSafely } from "@/lib/server/clerk";
import type { Locale, UserPreferences } from "@/types";

function getVerifiedPrimaryEmail(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!user?.primaryEmailAddressId) {
    return null;
  }

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return primaryEmail?.verification?.status === "verified"
    ? primaryEmail.emailAddress
    : null;
}

export async function resolveRequestPreferences(): Promise<UserPreferences> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const { userId } = await auth();

  if (!userId) {
    return {
      ...defaultUserPreferences,
      locale: cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultUserPreferences.locale,
    };
  }

  const user = await getCurrentUserSafely();

  if (!user) {
    return {
      ...defaultUserPreferences,
      locale: cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultUserPreferences.locale,
    };
  }

  const account = await getOrCreateAccount({
    clerkUserId: userId,
    verifiedEmail: getVerifiedPrimaryEmail(user),
  });

  return {
    locale: isLocale(account.locale)
      ? account.locale
      : cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : defaultUserPreferences.locale,
    region: isRegion(account.region) ? account.region : defaultUserPreferences.region,
    timezone: account.timezone || defaultUserPreferences.timezone,
    currency: isCurrency(account.currency) ? account.currency : defaultUserPreferences.currency,
  };
}

export async function resolveRequestLocale(): Promise<Locale> {
  return (await resolveRequestPreferences()).locale ?? defaultLocale;
}
