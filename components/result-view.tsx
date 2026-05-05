"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getTranslator } from "@/lib/i18n";
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
import {
  clearAnonymousSectionProgress,
  getAnonymousSectionResult,
} from "@/lib/client/anonymous-progress";
import { fetchSectionResult, startAttempt } from "@/lib/client/api";
import type { Locale, Section, SectionResult } from "@/types";

type ResultViewProps = {
  locale: Locale;
  section: Section;
  attemptId?: string;
  anonymous?: boolean;
};

function percent(value: number) {
  return Math.round(value * 100);
}

function resultMessage(
  rate: number,
  t: ReturnType<typeof getTranslator>,
) {
  if (rate === 1) return t("result.messages.perfect");
  if (rate >= 0.7) return t("result.messages.good");
  if (rate > 0) return t("result.messages.retry");
  return t("result.messages.review");
}

export function ResultView({ locale, section, attemptId, anonymous = false }: ResultViewProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<SectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const isSignedIn = isLoaded && Boolean(userId);
  const t = getTranslator(locale);

  useEffect(() => {
    const translate = getTranslator(locale);

    if (anonymous) {
      const anonymousResult = getAnonymousSectionResult(section.id);

      setResult(anonymousResult);
      setError("");
      setLoading(false);
      return;
    }

    if (!isLoaded) {
      return;
    }

    let active = true;

    if (!isSignedIn) {
      const anonymousResult = getAnonymousSectionResult(section.id);

      if (active) {
        setResult(anonymousResult);
        setError("");
        setLoading(false);
      }

      return () => {
        active = false;
      };
    }

    fetchSectionResult(section.id, attemptId)
      .then((data) => {
        if (active) {
          setResult(data);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setError(translate("result.errors.fetchFailed"));
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
  }, [anonymous, attemptId, isLoaded, isSignedIn, locale, section.id]);

  async function handleRetry() {
    setRetrying(true);

    if (!isSignedIn) {
      clearAnonymousSectionProgress(section.id);
      router.push(`/section/${section.id}`);
      return;
    }

    try {
      await startAttempt(section.id, true);
      router.push(`/section/${section.id}`);
    } catch {
      toast.error(t("result.errors.retryFailed"));
    } finally {
      setRetrying(false);
    }
  }

  const rate = result?.correctRate ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{t("result.title", { sectionName: section.name })}</h1>
          </div>
        </div>

        <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                t("app.common.loading")
              ) : result ? (
                <>
                  <Sparkles className="size-5 text-emerald-600" />
                  {resultMessage(rate, t)}
                </>
              ) : (
                <>
                  <CircleAlert className="size-5 text-red-600" />
                  {t("result.missing")}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {result ? t("result.attempt", { attemptNo: result.attemptNo }) : t("result.empty")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">{t("result.stats.score")}</p>
                    <p className="text-3xl font-semibold">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">{t("result.stats.correctRate")}</p>
                    <p className="text-3xl font-semibold">{percent(rate)}%</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">{t("result.stats.incorrectCount")}</p>
                    <p className="text-3xl font-semibold">{result.incorrectAnswers.length}</p>
                  </div>
                </div>
                <Progress value={percent(rate)} />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">{t("result.review.title")}</h2>
                  {result.incorrectAnswers.length === 0 ? (
                    <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                      <span>{t("result.review.empty")}</span>
                    </p>
                  ) : (
                    result.incorrectAnswers.map((answer) => (
                      <div key={answer.questionId} className="rounded-xl border border-zinc-200 bg-white p-4">
                        <p className="font-medium">{answer.question}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-700">
                              {t("result.review.yourAnswer")}
                            </p>
                            <p className="mt-1 font-semibold text-red-900">{answer.selectedChoiceId}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                              {t("result.review.answer")}
                            </p>
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
              <Link href="/">{t("app.common.backHome")}</Link>
            </Button>
            <Button disabled={retrying} onClick={handleRetry}>
              <RotateCcw className="size-4" />
              {t("result.actions.retry")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
