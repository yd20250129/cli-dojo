import { isLearnerId } from "@/lib/shared/validation";

export function getLegacyLearnerId(request: Request) {
  const learnerId = request.headers.get("X-Legacy-Learner-Id");
  return learnerId && isLearnerId(learnerId) ? learnerId : null;
}
