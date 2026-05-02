import { errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { completeAttempt } from "@/lib/server/progress-repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    const { attemptId } = await context.params;
    const attempt = await completeAttempt({ userId: user.userId, attemptId });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
