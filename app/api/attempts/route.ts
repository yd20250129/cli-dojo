import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import {
  createRetryAttempt,
  getOrCreateCurrentAttempt,
} from "@/lib/server/progress-repository";
import { isSectionId } from "@/lib/shared/validation";
import type { CreateAttemptRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount(request);
    const body = requireJsonObject(await request.json()) as Partial<CreateAttemptRequest>;

    if (!body.sectionId || !isSectionId(body.sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    const attempt = body.retry
      ? await createRetryAttempt({
          userId: account.userId,
          accountId: account.id,
          sectionId: body.sectionId,
        })
      : await getOrCreateCurrentAttempt({
          userId: account.userId,
          accountId: account.id,
          sectionId: body.sectionId,
        });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
