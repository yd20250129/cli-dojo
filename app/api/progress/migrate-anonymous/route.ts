import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import { migrateLegacyProgressIfNeeded } from "@/lib/server/progress-repository";
import { isLearnerId } from "@/lib/shared/validation";

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount();
    const body = requireJsonObject(await request.json()) as { learnerId?: string };

    if (!body.learnerId || !isLearnerId(body.learnerId)) {
      throw new AppError("INVALID_LEARNER_ID", 400);
    }

    const result = await migrateLegacyProgressIfNeeded({
      accountId: account.id,
      legacyLearnerId: body.learnerId,
    });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
