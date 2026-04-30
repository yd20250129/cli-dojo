import Link from "next/link";

import { ResultView } from "@/components/result-view";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";
import { getSectionById } from "@/lib/shared/questions";
import { isSectionId } from "@/lib/shared/validation";

export default async function SectionResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ attemptId?: string; anonymous?: string }>;
}) {
  const { sectionId } = await params;
  const { attemptId, anonymous } = await searchParams;
  const locale = await resolveRequestLocale();

  if (!isSectionId(sectionId)) {
    return <SectionNotFound locale={locale} />;
  }

  const section = getSectionById(sectionId, locale);

  if (!section) {
    return <SectionNotFound locale={locale} />;
  }

  return (
    <ResultView
      anonymous={anonymous === "1"}
      attemptId={attemptId}
      locale={locale}
      section={section}
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
