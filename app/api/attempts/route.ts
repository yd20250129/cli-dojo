import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getLearnerId } from "@/lib/server/request";
import {
  createRetryAttempt,
  getOrCreateCurrentAttempt,
} from "@/lib/server/progress-repository";
import { isSectionId } from "@/lib/shared/validation";
import type { CreateAttemptRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const learnerId = getLearnerId(request);
    const body = requireJsonObject(await request.json()) as Partial<CreateAttemptRequest>;

    if (!body.sectionId || !isSectionId(body.sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    const attempt = body.retry
      ? await createRetryAttempt({ learnerId, sectionId: body.sectionId })
      : await getOrCreateCurrentAttempt({ learnerId, sectionId: body.sectionId });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
