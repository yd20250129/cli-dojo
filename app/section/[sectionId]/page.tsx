import Link from "next/link";

import { QuizView } from "@/components/quiz-view";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuestionsBySectionId, getSectionById } from "@/lib/shared/questions";
import { isSectionId } from "@/lib/shared/validation";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  if (!isSectionId(sectionId)) {
    return <SectionNotFound />;
  }

  const section = getSectionById(sectionId);

  if (!section) {
    return <SectionNotFound />;
  }

  return (
    <QuizView
      section={section}
      questions={getQuestionsBySectionId(sectionId)}
    />
  );
}

function SectionNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>セクションが見つかりません</CardTitle>
          <CardDescription>ホームから学習するカテゴリを選び直してください。</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
