"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchProgress } from "@/lib/client/api";
import type { ProgressSummary, Section } from "@/types";

type HomeViewProps = {
  sections: Section[];
};

function percent(value: number) {
  return Math.round(value * 100);
}

export function HomeView({ sections }: HomeViewProps) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchProgress()
      .then((data) => {
        if (active) {
          setProgress(data);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setError("進捗を読み込めませんでした");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const progressBySection = useMemo(() => {
    return new Map(progress?.sections.map((section) => [section.sectionId, section]));
  }, [progress]);

  const totalQuestions = progress?.totalQuestionCount ?? sections.reduce((sum, section) => sum + section.questionCount, 0);
  const answered = progress?.totalAnsweredCount ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="font-mono text-sm text-emerald-700">Command Learner</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              CLIコマンドを、カテゴリごとに短く反復する。
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              ターミナル、npm、Git、開発サーバー、テスト、デプロイを4択で確認します。
            </p>
          </div>
          <Card className="self-start rounded-lg">
            <CardHeader>
              <CardTitle>全体進捗</CardTitle>
              <CardDescription>
                {answered} / {totalQuestions} 問 回答済み
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={percent(progress?.overallProgressRate ?? 0)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-sm text-zinc-500">進捗率</p>
                  <p className="text-2xl font-semibold">{percent(progress?.overallProgressRate ?? 0)}%</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-sm text-zinc-500">正答率</p>
                  <p className="text-2xl font-semibold">{percent(progress?.overallCorrectRate ?? 0)}%</p>
                </div>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/progress">詳しく見る</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const sectionProgress = progressBySection.get(section.id);
            const answeredCount = sectionProgress?.answeredCount ?? 0;
            const correctRate = percent(sectionProgress?.correctRate ?? 0);
            const completed = Boolean(sectionProgress?.isCompleted);

            return (
              <Card key={section.id} className="rounded-lg">
                <CardHeader>
                  <CardTitle>{section.name}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                  <CardAction>
                    {completed ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        完了
                      </span>
                    ) : null}
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{answeredCount} / {section.questionCount} 問</span>
                    <span>正答率 {correctRate}%</span>
                  </div>
                  <Progress value={(answeredCount / section.questionCount) * 100} />
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/section/${section.id}`}>
                      {answeredCount > 0 && !completed ? "続きから" : "学習を始める"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
