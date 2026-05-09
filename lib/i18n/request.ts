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
import { getCurrentUserSafely } from "@/lib/server/clerk";
import { getOrCreateAuthenticatedUser } from "@/lib/server/users-repository";
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

function getClerkDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  const displayName = user?.fullName?.trim() || user?.username?.trim();
  return displayName || null;
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

  const userProfile = await getOrCreateAuthenticatedUser({
    clerkUserId: userId,
    verifiedEmail: getVerifiedPrimaryEmail(user),
    displayName: getClerkDisplayName(user),
  });

  return {
    locale: isLocale(userProfile.locale)
      ? userProfile.locale
      : cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : defaultUserPreferences.locale,
    region: isRegion(userProfile.region)
      ? userProfile.region
      : defaultUserPreferences.region,
    timezone: userProfile.timezone || defaultUserPreferences.timezone,
    currency: isCurrency(userProfile.currency)
      ? userProfile.currency
      : defaultUserPreferences.currency,
  };
}

export async function resolveRequestLocale(): Promise<Locale> {
  return (await resolveRequestPreferences()).locale ?? defaultLocale;
}
