import { AppError, errorResponse } from "@/lib/server/api-errors";
import { getSectionResult } from "@/lib/server/progress-repository";
import { getLearnerId } from "@/lib/server/request";
import { isSectionId } from "@/lib/shared/validation";

export async function GET(
  request: Request,
  context: { params: Promise<{ sectionId: string }> },
) {
  try {
    const learnerId = getLearnerId(request);
    const { sectionId } = await context.params;

    if (!isSectionId(sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    const url = new URL(request.url);
    const attemptId = url.searchParams.get("attemptId") ?? undefined;
    const result = await getSectionResult({ learnerId, sectionId, attemptId });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
