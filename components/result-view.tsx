"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchSectionResult, startAttempt } from "@/lib/client/api";
import type { Section, SectionResult } from "@/types";

type ResultViewProps = {
  section: Section;
  attemptId?: string;
};

function percent(value: number) {
  return Math.round(value * 100);
}

function resultMessage(rate: number) {
  if (rate === 1) return "全問正解です";
  if (rate >= 0.7) return "よく理解できています";
  if (rate > 0) return "復習してもう一度挑戦しましょう";
  return "まずは解説を確認しましょう";
}

export function ResultView({ section, attemptId }: ResultViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<SectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;

    fetchSectionResult(section.id, attemptId)
      .then((data) => {
        if (active) {
          setResult(data);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setError("学習結果を読み込めませんでした");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [attemptId, section.id]);

  async function handleRetry() {
    setRetrying(true);

    try {
      await startAttempt(section.id, true);
      router.push(`/section/${section.id}`);
    } catch {
      toast.error("再挑戦を開始できませんでした");
    } finally {
      setRetrying(false);
    }
  }

  const rate = result?.correctRate ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-700">{section.id}</p>
            <h1 className="text-3xl font-semibold">{section.name} の結果</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>
              {loading ? "読み込み中..." : result ? resultMessage(rate) : "学習結果が見つかりません"}
            </CardTitle>
            <CardDescription>
              {result ? `Attempt ${result.attemptNo}` : "セクションを完了すると結果が表示されます"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-zinc-500">正答数</p>
                    <p className="text-3xl font-semibold">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-zinc-500">正答率</p>
                    <p className="text-3xl font-semibold">{percent(rate)}%</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm text-zinc-500">不正解</p>
                    <p className="text-3xl font-semibold">{result.incorrectAnswers.length}</p>
                  </div>
                </div>
                <Progress value={percent(rate)} />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">復習</h2>
                  {result.incorrectAnswers.length === 0 ? (
                    <p className="rounded-lg border bg-emerald-50 p-4 text-emerald-800">
                      今回の不正解はありません。
                    </p>
                  ) : (
                    result.incorrectAnswers.map((answer) => (
                      <div key={answer.questionId} className="rounded-lg border bg-white p-4">
                        <p className="font-medium">{answer.question}</p>
                        <p className="mt-2 text-sm text-zinc-600">
                          あなたの回答: {answer.selectedChoiceId} / 正解: {answer.correctChoiceId}
                        </p>
                        <p className="mt-2 leading-7 text-zinc-700">{answer.explanation}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/">ホームへ戻る</Link>
            </Button>
            <Button disabled={retrying} onClick={handleRetry}>
              もう一度挑戦
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
