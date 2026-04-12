import { errorResponse } from "@/lib/server/api-errors";
import { completeAttempt } from "@/lib/server/progress-repository";
import { getLearnerId } from "@/lib/server/request";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const learnerId = getLearnerId(request);
    const { attemptId } = await context.params;
    const attempt = await completeAttempt({ learnerId, attemptId });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
