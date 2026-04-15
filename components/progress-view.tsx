"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchProgress } from "@/lib/client/api";
import type { ProgressSummary, Section } from "@/types";

type ProgressViewProps = {
  sections: Section[];
};

function percent(value: number) {
  return Math.round(value * 100);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProgressView({ sections }: ProgressViewProps) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgress()
      .then((data) => {
        setProgress(data);
        setError("");
      })
      .catch(() => {
        setError("進捗を読み込めませんでした");
      });
  }, []);

  const progressBySection = useMemo(() => {
    return new Map(progress?.sections.map((section) => [section.sectionId, section]));
  }, [progress]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-700">Progress</p>
            <h1 className="text-3xl font-semibold">全体進捗</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{percent(progress?.overallProgressRate ?? 0)}%</CardTitle>
                <CardDescription>進捗率</CardDescription>
              </div>
              <div className="space-y-1 text-right">
                <CardTitle>
                  {progress?.totalAnsweredCount ?? 0} / {progress?.totalQuestionCount ?? 118}
                </CardTitle>
                <CardDescription>回答済み</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={percent(progress?.overallProgressRate ?? 0)} />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>{percent(progress?.overallCorrectRate ?? 0)}%</CardTitle>
              <CardDescription>正答率</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={percent(progress?.overallCorrectRate ?? 0)} />
            </CardContent>
          </Card>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm md:hidden">
          <CardHeader>
            <CardTitle>セクション別</CardTitle>
            <CardDescription>スマートフォンではカード形式で確認できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => {
              const item = progressBySection.get(section.id);
              const answered = item?.answeredCount ?? 0;
              const correct = item?.correctCount ?? 0;
              const correctRate = percent(item?.correctRate ?? 0);

              return (
                <div key={section.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {item?.isPerfect ? "全問正解" : item?.isCompleted ? "完了" : answered > 0 ? "学習中" : "未着手"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-zinc-600">
                      <span>
                        {answered} / {section.questionCount} 問
                      </span>
                      <span>正答率 {correctRate}%</span>
                    </div>
                    <Progress value={(answered / section.questionCount) * 100} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-white bg-white p-3">
                      <p className="text-zinc-500">回答済み</p>
                      <p className="mt-1 text-lg font-semibold">{answered}</p>
                    </div>
                    <div className="rounded-xl border border-white bg-white p-3">
                      <p className="text-zinc-500">正解</p>
                      <p className="mt-1 text-lg font-semibold">{correct}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="hidden rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm md:block">
          <CardHeader>
            <CardTitle>セクション別</CardTitle>
            <CardDescription>回答数、正答数、直近回答日時を確認できます。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-zinc-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">セクション</th>
                  <th className="py-3 pr-4 font-medium">回答済み</th>
                  <th className="py-3 pr-4 font-medium">正解</th>
                  <th className="py-3 pr-4 font-medium">正答率</th>
                  <th className="py-3 pr-4 font-medium">直近回答</th>
                  <th className="py-3 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => {
                  const item = progressBySection.get(section.id);
                  const answered = item?.answeredCount ?? 0;
                  const correct = item?.correctCount ?? 0;

                  return (
                    <tr key={section.id} className="border-b last:border-0">
                      <td className="py-4 pr-4 font-medium">{section.name}</td>
                      <td className="py-4 pr-4">
                        {answered} / {section.questionCount}
                      </td>
                      <td className="py-4 pr-4">{correct}</td>
                      <td className="py-4 pr-4">{percent(item?.correctRate ?? 0)}%</td>
                      <td className="py-4 pr-4">{formatDate(item?.latestAnsweredAt ?? null)}</td>
                      <td className="py-4">
                        {item?.isPerfect ? "全問正解" : item?.isCompleted ? "完了" : answered > 0 ? "学習中" : "未着手"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
