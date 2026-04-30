import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import {
  migrateAnonymousProgressIfNeeded,
  migrateLegacyProgressIfNeeded,
} from "@/lib/server/progress-repository";
import { isLearnerId, parseAnonymousProgressState } from "@/lib/shared/validation";
import type { MigrateAnonymousProgressRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount();
    const body = requireJsonObject(await request.json()) as Partial<
      MigrateAnonymousProgressRequest & { learnerId?: string }
    >;

    if (body.learnerId) {
      if (!isLearnerId(body.learnerId)) {
        throw new AppError("INVALID_LEARNER_ID", 400);
      }

      const result = await migrateLegacyProgressIfNeeded({
        userId: account.userId,
        accountId: account.id,
        legacyLearnerId: body.learnerId,
      });

      return Response.json({ data: result });
    }

    if (!body.anonymousProgress) {
      throw new AppError("UNKNOWN", 400, "移行対象の進捗データがありません");
    }

    const result = await migrateAnonymousProgressIfNeeded({
      userId: account.userId,
      accountId: account.id,
      anonymousProgress: parseAnonymousProgressState(body.anonymousProgress),
    });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
