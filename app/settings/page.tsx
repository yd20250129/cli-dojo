import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { SettingsView } from "@/components/settings-view";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { resolveRequestLocale } from "@/lib/i18n/request";

export default async function SettingsPage() {
  const locale = await resolveRequestLocale();
  let appUser;

  try {
    appUser = await getAuthenticatedUser();
  } catch {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  return (
    <SettingsView
      locale={locale}
      imageUrl={clerkUser.imageUrl}
      name={clerkUser.fullName || clerkUser.username || "User"}
      email={appUser.canonicalEmail || ""}
    />
  );
}
