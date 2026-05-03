import { auth, currentUser } from "@clerk/nextjs/server";

import { AppError } from "@/lib/server/api-errors";
import { getCurrentUserSafely } from "@/lib/server/clerk";
import { getOrCreateAuthenticatedUser } from "@/lib/server/users-repository";

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

export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401);
  }

  const clerkUser = await getCurrentUserSafely();

  if (!clerkUser) {
    throw new AppError("UNAUTHORIZED", 401);
  }

  return getOrCreateAuthenticatedUser({
    clerkUserId: userId,
    verifiedEmail: getVerifiedPrimaryEmail(clerkUser),
  });
}
