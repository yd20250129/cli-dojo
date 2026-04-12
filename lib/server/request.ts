import { AppError } from "@/lib/server/api-errors";
import { isLearnerId } from "@/lib/shared/validation";

export function getLearnerId(request: Request) {
  const learnerId = request.headers.get("X-Learner-Id") ?? "";

  if (!isLearnerId(learnerId)) {
    throw new AppError("INVALID_LEARNER_ID", 400);
  }

  return learnerId;
}
