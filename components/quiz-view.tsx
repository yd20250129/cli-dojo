"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, CircleCheckBig, Info, XCircle } from "lucide-react";
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
  getAnonymousAttemptQuestionIds,
  getAnonymousAnsweredQuestionIds,
  recordAnonymousAnswer,
} from "@/lib/client/anonymous-progress";
import { completeAttempt, fetchSectionResult, saveAnswer, startAttempt } from "@/lib/client/api";
import { getResumeQuestionIndex } from "@/lib/shared/resume";
import { cn } from "@/lib/utils";
import type { ChoiceId, Locale, Question, Section, SectionAttempt } from "@/types";

type QuizViewProps = {
  locale: Locale;
  section: Section;
  questions: Question[];
};

export function QuizView({ locale, section, questions }: QuizViewProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [attempt, setAttempt] = useState<SectionAttempt | null>(null);
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<ChoiceId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startError, setStartError] = useState("");

  const isSignedIn = isLoaded && Boolean(userId);
  const t = getTranslator(locale);

  const currentQuestion = activeQuestions[currentIndex];
  const isLastQuestion = currentIndex === activeQuestions.length - 1;
  const isCorrect = selectedChoiceId === currentQuestion?.answer;
  const progressValue =
    activeQuestions.length === 0
      ? 0
      : ((currentIndex + (selectedChoiceId ? 1 : 0)) / activeQuestions.length) * 100;

  useEffect(() => {
    const translate = getTranslator(locale);
    const resolveQuestions = (questionIds: string[] | null) => {
      if (!questionIds || questionIds.length === 0) {
        return questions;
      }

      const questionIdSet = new Set(questionIds);
      const filteredQuestions = questions.filter((question) => questionIdSet.has(question.id));
      return filteredQuestions.length > 0 ? filteredQuestions : questions;
    };

    if (!isLoaded) {
      return;
    }

    let active = true;

    if (!isSignedIn) {
      setAttempt(null);
      const scopedQuestions = resolveQuestions(getAnonymousAttemptQuestionIds(section.id));
      const answeredQuestionIds = getAnonymousAnsweredQuestionIds(section.id);
      const resumeIndex = getResumeQuestionIndex(scopedQuestions, answeredQuestionIds);

      if (resumeIndex === -1 && answeredQuestionIds.length > 0) {
        router.push(`/section/${section.id}/result?anonymous=1`);
        return () => {
          active = false;
        };
      }

      setActiveQuestions(scopedQuestions);
      setCurrentIndex(resumeIndex === -1 ? 0 : resumeIndex);
      setSelectedChoiceId(null);
      setStartError("");
      return () => {
        active = false;
      };
    }

    startAttempt(section.id)
      .then(async (data) => {
        if (active) {
          setAttempt(data);
          let scopedQuestions = questions;

          if (data.totalQuestions < questions.length) {
            const latestResult = await fetchSectionResult(section.id);
            const retryQuestionIds = latestResult?.incorrectAnswers.map((answer) => answer.questionId) ?? [];
            scopedQuestions = resolveQuestions(retryQuestionIds);
          }

          const resumeIndex = getResumeQuestionIndex(scopedQuestions, data.answeredQuestionIds);

          setActiveQuestions(scopedQuestions);

          if (resumeIndex === -1) {
            completeAttempt(data.id)
              .then(() => {
                router.push(`/section/${section.id}/result?attemptId=${data.id}`);
              })
              .catch(() => {
                setStartError(translate("quiz.errors.startSaveFailed"));
              });
            return;
          }
          setCurrentIndex(resumeIndex);
          setSelectedChoiceId(null);
          setStartError("");
        }
      })
      .catch(() => {
        if (active) {
          setStartError(translate("quiz.errors.startFailed"));
        }
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, locale, questions, router, section.id]);

  const correctChoiceText = useMemo(() => {
    return currentQuestion?.choices.find((choice) => choice.id === currentQuestion.answer)?.text ?? "";
  }, [currentQuestion]);

  async function handleAnswer(choiceId: ChoiceId) {
    if (selectedChoiceId || !currentQuestion) {
      return;
    }

    setSelectedChoiceId(choiceId);

    if (!isSignedIn) {
      recordAnonymousAnswer({
        sectionId: section.id,
        questionId: currentQuestion.id,
        selectedChoiceId: choiceId,
      });
      return;
    }

    if (!attempt) {
      return;
    }

    setIsSaving(true);

    try {
      await saveAnswer({
        attemptId: attempt.id,
        sectionId: section.id,
        questionId: currentQuestion.id,
        selectedChoiceId: choiceId,
      });
    } catch {
      toast.warning(t("quiz.errors.progressSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNext() {
    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      setSelectedChoiceId(null);
      return;
    }

    if (!isSignedIn) {
      router.push(`/section/${section.id}/result?anonymous=1`);
      return;
    }

    if (!attempt) {
      return;
    }

    try {
      await completeAttempt(attempt.id);
      router.push(`/section/${section.id}/result?attemptId=${attempt.id}`);
    } catch {
      toast.error(t("quiz.errors.resultSaveFailed"));
    }
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader locale={locale} />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{t("quiz.empty.title")}</CardTitle>
              <CardDescription>{t("quiz.empty.description")}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/">{t("app.common.backHome")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{section.name}</h1>
          </div>
        </div>

        <Card className="border-border bg-surface-raised shadow-sm">
          <CardHeader>
            <CardTitle>
              {t("quiz.header.progress", {
                current: currentIndex + 1,
                total: activeQuestions.length,
              })}
            </CardTitle>
            <CardDescription>{currentQuestion.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progressValue} />

            {startError ? (
              <p className="flex items-start gap-2 rounded-xl border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error-text">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {startError}
              </p>
            ) : null}

            <h2 className="text-xl font-semibold leading-8">{currentQuestion.question}</h2>

            <div className="grid gap-3">
              {currentQuestion?.choices.map((choice) => {
                const answered = Boolean(selectedChoiceId);
                const isSelected = selectedChoiceId === choice.id;
                const isAnswer = currentQuestion.answer === choice.id;

                return (
                  <button
                    key={choice.id}
                    className={cn(
                      "min-h-14 rounded-xl border bg-surface-raised px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
                      !answered && "hover:border-foreground hover:bg-surface-subtle",
                      answered && isAnswer && "border-choice-correct-border bg-choice-correct-bg text-choice-correct-text",
                      answered && isSelected && !isAnswer && "border-choice-wrong-border bg-choice-wrong-bg text-choice-wrong-text",
                    )}
                    disabled={(isSignedIn && !attempt) || answered}
                    onClick={() => handleAnswer(choice.id)}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full border font-mono text-sm font-semibold",
                          answered && isAnswer && "border-choice-correct-border bg-status-success-bg",
                          answered && isSelected && !isAnswer && "border-choice-wrong-border bg-status-error-bg",
                          !answered && "border-border bg-surface-subtle",
                        )}
                      >
                        {choice.id}
                      </span>
                      <span className="leading-7">{choice.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedChoiceId ? (
              <div className="rounded-xl border bg-surface-subtle p-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="size-5 text-status-success" />
                  ) : (
                    <XCircle className="size-5 text-status-error" />
                  )}
                  <p className={cn("font-semibold", isCorrect ? "text-status-success-text" : "text-status-error-text")}>
                    {isCorrect ? t("quiz.feedback.correct") : t("quiz.feedback.incorrect")}
                  </p>
                </div>
                {!isCorrect ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {t("quiz.feedback.correctChoice", {
                      choiceId: currentQuestion.answer,
                      choiceText: correctChoiceText,
                    })}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface-raised p-3">
                    <p className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                      {t("quiz.feedback.yourChoice")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">{selectedChoiceId}</p>
                  </div>
                  <div className="rounded-xl border border-status-success-border bg-status-success-bg p-3">
                    <p className="text-xs font-medium uppercase tracking-eyebrow text-status-success-text">
                      {t("quiz.feedback.answer")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-status-success-text-strong">
                      {currentQuestion.answer}: {correctChoiceText}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 leading-7 text-text-secondary">
                  <CircleCheckBig className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <span>{currentQuestion.explanation}</span>
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="border-t bg-surface-subtle/90 py-4 backdrop-blur">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild className="w-full sm:w-auto" variant="outline">
                <Link href="/">{t("app.common.backHome")}</Link>
              </Button>
              <Button className="w-full sm:w-auto" disabled={!selectedChoiceId || isSaving} onClick={handleNext}>
                {isSaving
                  ? t("quiz.actions.saving")
                  : isLastQuestion
                    ? t("quiz.actions.viewResult")
                    : t("quiz.actions.next")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
