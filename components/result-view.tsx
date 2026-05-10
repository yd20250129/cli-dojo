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
  getAnonymousIncorrectQuestionIds,
  getAnonymousSectionResult,
  resetAnonymousSectionAttempt,
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

  async function handleRetryAll() {
    setRetrying(true);

    if (!isSignedIn) {
      resetAnonymousSectionAttempt(section.id);
      router.push(`/section/${section.id}`);
      return;
    }

    try {
      await startAttempt(section.id, { retry: true });
      router.push(`/section/${section.id}`);
    } catch {
      toast.error(t("result.errors.retryFailed"));
    } finally {
      setRetrying(false);
    }
  }

  async function handleRetryIncorrect() {
    if (!result || result.incorrectAnswers.length === 0) {
      return;
    }

    setRetrying(true);

    const incorrectQuestionIds = result.incorrectAnswers.map((answer) => answer.questionId);

    if (!isSignedIn) {
      const anonymousIncorrectQuestionIds = getAnonymousIncorrectQuestionIds(section.id);
      resetAnonymousSectionAttempt(
        section.id,
        anonymousIncorrectQuestionIds.length > 0 ? anonymousIncorrectQuestionIds : incorrectQuestionIds,
      );
      router.push(`/section/${section.id}`);
      return;
    }

    try {
      await startAttempt(section.id, { retry: true, questionIds: incorrectQuestionIds });
      router.push(`/section/${section.id}`);
    } catch {
      toast.error(t("result.errors.retryFailed"));
    } finally {
      setRetrying(false);
    }
  }

  const rate = result?.correctRate ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{t("result.title", { sectionName: section.name })}</h1>
          </div>
        </div>

        <Card className="border-border bg-surface-raised shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                t("app.common.loading")
              ) : result ? (
                <>
                  <Sparkles className="size-5 text-status-success" />
                  {resultMessage(rate, t)}
                </>
              ) : (
                <>
                  <CircleAlert className="size-5 text-status-error" />
                  {t("result.missing")}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {result ? t("result.attempt", { attemptNo: result.attemptNo }) : t("result.empty")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? <p className="text-sm text-status-error">{error}</p> : null}
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface-subtle p-4">
                    <p className="text-sm text-muted-foreground">{t("result.stats.score")}</p>
                    <p className="text-3xl font-semibold">
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-subtle p-4">
                    <p className="text-sm text-muted-foreground">{t("result.stats.correctRate")}</p>
                    <p className="text-3xl font-semibold">{percent(rate)}%</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-subtle p-4">
                    <p className="text-sm text-muted-foreground">{t("result.stats.incorrectCount")}</p>
                    <p className="text-3xl font-semibold">{result.incorrectAnswers.length}</p>
                  </div>
                </div>
                <Progress value={percent(rate)} />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">{t("result.review.title")}</h2>
                  {result.incorrectAnswers.length === 0 ? (
                    <p className="flex items-start gap-2 rounded-xl border border-status-success-border bg-status-success-bg p-4 text-status-success-text">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                      <span>{t("result.review.empty")}</span>
                    </p>
                  ) : (
                    result.incorrectAnswers.map((answer) => (
                      <div key={answer.questionId} className="rounded-xl border border-border bg-surface-raised p-4">
                        <p className="font-medium">{answer.question}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-status-error-border bg-status-error-bg p-3">
                            <p className="text-xs font-medium uppercase tracking-eyebrow text-status-error-text">
                              {t("result.review.yourAnswer")}
                            </p>
                            <p className="mt-1 font-semibold text-status-error-text-strong">{answer.selectedChoiceId}</p>
                          </div>
                          <div className="rounded-xl border border-status-success-border bg-status-success-bg p-3">
                            <p className="text-xs font-medium uppercase tracking-eyebrow text-status-success-text">
                              {t("result.review.answer")}
                            </p>
                            <p className="mt-1 font-semibold text-status-success-text-strong">{answer.correctChoiceId}</p>
                          </div>
                        </div>
                        <p className="mt-3 flex items-start gap-2 leading-7 text-text-secondary">
                          <CircleAlert className="mt-1 size-4 shrink-0 text-muted-foreground" />
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
            {result && result.incorrectAnswers.length > 0 ? (
              <Button disabled={retrying} onClick={handleRetryIncorrect} variant="outline">
                <RotateCcw className="size-4" />
                {t("result.actions.retryIncorrect")}
              </Button>
            ) : null}
            <Button disabled={retrying} onClick={handleRetryAll}>
              <RotateCcw className="size-4" />
              {t("result.actions.retryAll")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
