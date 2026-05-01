import { auth, currentUser } from "@clerk/nextjs/server";

import { AppError } from "@/lib/server/api-errors";
import { getOrCreateAccount } from "@/lib/server/accounts-repository";
import { getCurrentUserSafely } from "@/lib/server/clerk";
import { migrateLegacyProgressIfNeeded } from "@/lib/server/progress-repository";
import { isLearnerId } from "@/lib/shared/validation";

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

export async function getAuthenticatedAccount(request?: Request) {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401);
  }

  const user = await getCurrentUserSafely();

  if (!user) {
    throw new AppError("UNAUTHORIZED", 401);
  }

  const account = await getOrCreateAccount({
    clerkUserId: userId,
    verifiedEmail: getVerifiedPrimaryEmail(user),
  });
  const legacyLearnerId = request?.headers.get("X-Legacy-Learner-Id");

  if (legacyLearnerId && isLearnerId(legacyLearnerId)) {
    await migrateLegacyProgressIfNeeded({
      userId: account.userId,
      accountId: account.id,
      legacyLearnerId,
    });
  }

  return account;
}
