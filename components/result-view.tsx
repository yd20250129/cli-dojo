"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, RotateCcw, Sparkles } from "lucide-react";
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

        <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                "読み込み中..."
              ) : result ? (
                <>
                  <Sparkles className="size-5 text-emerald-600" />
                  {resultMessage(rate)}
                </>
              ) : (
                <>
                  <CircleAlert className="size-5 text-red-600" />
                  学習結果が見つかりません
                </>
              )}
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
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">正答数</p>
                    <p className="text-3xl font-semibold">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">正答率</p>
                    <p className="text-3xl font-semibold">{percent(rate)}%</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">不正解</p>
                    <p className="text-3xl font-semibold">{result.incorrectAnswers.length}</p>
                  </div>
                </div>
                <Progress value={percent(rate)} />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">復習</h2>
                  {result.incorrectAnswers.length === 0 ? (
                    <p className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                      <span>今回の不正解はありません。</span>
                    </p>
                  ) : (
                    result.incorrectAnswers.map((answer) => (
                      <div key={answer.questionId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="font-medium">{answer.question}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-700">
                              あなたの回答
                            </p>
                            <p className="mt-1 font-semibold text-red-900">{answer.selectedChoiceId}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">正解</p>
                            <p className="mt-1 font-semibold text-emerald-900">{answer.correctChoiceId}</p>
                          </div>
                        </div>
                        <p className="mt-3 flex items-start gap-2 leading-7 text-zinc-700">
                          <CircleAlert className="mt-1 size-4 shrink-0 text-zinc-500" />
                          <span>{answer.explanation}</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/">ホームへ戻る</Link>
            </Button>
            <Button disabled={retrying} onClick={handleRetry}>
              <RotateCcw className="size-4" />
              もう一度挑戦
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
