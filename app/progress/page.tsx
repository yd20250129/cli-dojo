import { ProgressView } from "@/components/progress-view";
import { resolveRequestPreferences } from "@/lib/i18n/request";
import { getSections } from "@/lib/shared/questions";

export default async function ProgressPage() {
  const preferences = await resolveRequestPreferences();

  return (
    <ProgressView
      locale={preferences.locale}
      sections={getSections(preferences.locale)}
      timezone={preferences.timezone}
    />
  );
}
