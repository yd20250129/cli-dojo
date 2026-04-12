const learnerIdKey = "cli-dojo:learner-id";

export function getOrCreateLearnerId(): string {
  const existing = window.localStorage.getItem(learnerIdKey);

  if (existing) {
    return existing;
  }

  const learnerId = crypto.randomUUID();
  window.localStorage.setItem(learnerIdKey, learnerId);
  return learnerId;
}
