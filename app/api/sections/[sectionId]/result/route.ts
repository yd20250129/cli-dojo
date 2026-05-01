import { AppError, errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import { getSectionResult } from "@/lib/server/progress-repository";
import { isSectionId } from "@/lib/shared/validation";

export async function GET(
  request: Request,
  context: { params: Promise<{ sectionId: string }> },
) {
  try {
    const account = await getAuthenticatedAccount(request);
    const { sectionId } = await context.params;

    if (!isSectionId(sectionId)) {
      throw new AppError("INVALID_SECTION", 400);
    }

    const url = new URL(request.url);
    const attemptId = url.searchParams.get("attemptId") ?? undefined;
    const result = await getSectionResult({
      userId: account.userId,
      sectionId,
      attemptId,
    });

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
