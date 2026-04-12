import { ProgressView } from "@/components/progress-view";
import { getSections } from "@/lib/shared/questions";

export default function ProgressPage() {
  return <ProgressView sections={getSections()} />;
}
