import { errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getProgressSummary } from "@/lib/server/progress-repository";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const progress = await getProgressSummary(user.userId);

    return Response.json({ data: progress });
  } catch (error) {
    return errorResponse(error);
  }
}
