import { HomeView } from "@/components/home-view";
import { getSections } from "@/lib/shared/questions";

export default function Home() {
  return <HomeView sections={getSections()} />;
}
