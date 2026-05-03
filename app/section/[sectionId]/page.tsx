import Link from "next/link";

import { QuizView } from "@/components/quiz-view";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";
import { getQuestionsBySectionId, getSectionById } from "@/lib/shared/questions";
import { isSectionId } from "@/lib/shared/validation";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const locale = await resolveRequestLocale();

  if (!isSectionId(sectionId)) {
    return <SectionNotFound locale={locale} />;
  }

  const section = getSectionById(sectionId, locale);

  if (!section) {
    return <SectionNotFound locale={locale} />;
  }

  return (
    <QuizView
      locale={locale}
      section={section}
      questions={getQuestionsBySectionId(sectionId, locale)}
    />
  );
}

function SectionNotFound({ locale }: { locale: "ja" | "en" }) {
  const t = getTranslator(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{t("section.notFound.title")}</CardTitle>
          <CardDescription>{t("section.notFound.description")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/">{t("app.common.backHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
