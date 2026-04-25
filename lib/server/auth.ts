import { auth } from "@clerk/nextjs/server";

import { AppError } from "@/lib/server/api-errors";
import { getOrCreateAccount } from "@/lib/server/accounts-repository";
import { migrateLegacyProgressIfNeeded } from "@/lib/server/progress-repository";
import { isLearnerId } from "@/lib/shared/validation";

export async function getAuthenticatedAccount(request?: Request) {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401);
  }

  const account = await getOrCreateAccount(userId);
  const legacyLearnerId = request?.headers.get("X-Legacy-Learner-Id");

  if (legacyLearnerId && isLearnerId(legacyLearnerId)) {
    await migrateLegacyProgressIfNeeded({
      accountId: account.id,
      legacyLearnerId,
    });
  }

  return account;
}
