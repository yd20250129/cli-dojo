import { AppError, errorResponse, requireJsonObject } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import { saveAnswer } from "@/lib/server/progress-repository";
import { isChoiceId, isSectionId } from "@/lib/shared/validation";
import type { SaveAnswerRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount(request);
    const body = requireJsonObject(await request.json()) as Partial<SaveAnswerRequest>;

    if (!body.sectionId || !isSectionId(body.sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    if (!body.selectedChoiceId || !isChoiceId(body.selectedChoiceId)) {
      throw new AppError("UNKNOWN", 400, "選択肢が正しくありません");
    }

    if (!body.attemptId || !body.questionId) {
      throw new AppError("UNKNOWN", 400, "回答データが不足しています");
    }

    const answer = await saveAnswer({
      userId: account.userId,
      accountId: account.id,
      attemptId: body.attemptId,
      sectionId: body.sectionId,
      questionId: body.questionId,
      selectedChoiceId: body.selectedChoiceId,
    });

    return Response.json({ data: answer });
  } catch (error) {
    return errorResponse(error);
  }
}
