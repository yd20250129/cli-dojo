import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  createRetryAttempt,
  getOrCreateCurrentAttempt,
} from "@/lib/server/progress-repository";
import { getQuestionById } from "@/lib/shared/questions";
import { isSectionId } from "@/lib/shared/validation";
import type { CreateAttemptRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = requireJsonObject(await request.json()) as Partial<CreateAttemptRequest>;

    if (!body.sectionId || !isSectionId(body.sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    const questionIds =
      Array.isArray(body.questionIds) && body.questionIds.every((value) => typeof value === "string")
        ? Array.from(
            new Set(
              body.questionIds.filter((questionId) => {
                const question = getQuestionById(questionId);
                return question?.sectionId === body.sectionId;
              }),
            ),
          )
        : undefined;

    const attempt = body.retry
      ? await createRetryAttempt({
          userId: user.userId,
          sectionId: body.sectionId,
          totalQuestions: questionIds && questionIds.length > 0 ? questionIds.length : undefined,
        })
      : await getOrCreateCurrentAttempt({
          userId: user.userId,
          sectionId: body.sectionId,
        });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
