import { HomeView } from "@/components/home-view";
import { resolveRequestLocale } from "@/lib/i18n/request";
import { getSections } from "@/lib/shared/questions";

export default async function Home() {
  const locale = await resolveRequestLocale();

  return <HomeView locale={locale} sections={getSections(locale)} />;
}
