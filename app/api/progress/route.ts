import { errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedAccount } from "@/lib/server/auth";
import { getProgressSummary } from "@/lib/server/progress-repository";

export async function GET(request: Request) {
  try {
    const account = await getAuthenticatedAccount(request);
    const progress = await getProgressSummary(account.userId);

    return Response.json({ data: progress });
  } catch (error) {
    return errorResponse(error);
  }
}
