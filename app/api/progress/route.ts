import { errorResponse } from "@/lib/server/api-errors";
import { getProgressSummary } from "@/lib/server/progress-repository";
import { getLearnerId } from "@/lib/server/request";

export async function GET(request: Request) {
  try {
    const learnerId = getLearnerId(request);
    const progress = await getProgressSummary(learnerId);

    return Response.json({ data: progress });
  } catch (error) {
    return errorResponse(error);
  }
}
