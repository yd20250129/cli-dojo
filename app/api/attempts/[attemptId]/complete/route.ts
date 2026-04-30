import { errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import { completeAttempt } from "@/lib/server/progress-repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const account = await getAuthenticatedAccount(request);
    const { attemptId } = await context.params;
    const attempt = await completeAttempt({ userId: account.userId, attemptId });

    return Response.json({ data: attempt });
  } catch (error) {
    return errorResponse(error);
  }
}
