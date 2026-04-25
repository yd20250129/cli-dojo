const learnerIdKey = "cli-dojo:learner-id";

export function getLegacyLearnerId(): string | null {
  return window.localStorage.getItem(learnerIdKey);
}

export function clearLegacyLearnerId() {
  window.localStorage.removeItem(learnerIdKey);
}
