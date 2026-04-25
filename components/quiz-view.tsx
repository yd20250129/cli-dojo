"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, CircleCheckBig, Info, XCircle } from "lucide-react";
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
import {
  getAnonymousAnsweredQuestionIds,
  recordAnonymousAnswer,
} from "@/lib/client/anonymous-progress";
import { completeAttempt, saveAnswer, startAttempt } from "@/lib/client/api";
import { getResumeQuestionIndex } from "@/lib/shared/resume";
import { cn } from "@/lib/utils";
import type { ChoiceId, Question, Section, SectionAttempt } from "@/types";

type QuizViewProps = {
  section: Section;
  questions: Question[];
};

export function QuizView({ section, questions }: QuizViewProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [attempt, setAttempt] = useState<SectionAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<ChoiceId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startError, setStartError] = useState("");

  const isSignedIn = isLoaded && Boolean(userId);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCorrect = selectedChoiceId === currentQuestion?.answer;
  const progressValue = ((currentIndex + (selectedChoiceId ? 1 : 0)) / questions.length) * 100;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let active = true;

    if (!isSignedIn) {
      setAttempt(null);
      const answeredQuestionIds = getAnonymousAnsweredQuestionIds(section.id);
      const resumeIndex = getResumeQuestionIndex(questions, answeredQuestionIds);

      if (resumeIndex === -1 && answeredQuestionIds.length > 0) {
        router.push(`/section/${section.id}/result?anonymous=1`);
        return () => {
          active = false;
        };
      }

      setCurrentIndex(resumeIndex === -1 ? 0 : resumeIndex);
      setSelectedChoiceId(null);
      setStartError("");
      return () => {
        active = false;
      };
    }

    startAttempt(section.id)
      .then((data) => {
        if (active) {
          setAttempt(data);
          const resumeIndex = getResumeQuestionIndex(questions, data.answeredQuestionIds);
          if (resumeIndex === -1) {
            completeAttempt(data.id)
              .then(() => {
                router.push(`/section/${section.id}/result?attemptId=${data.id}`);
              })
              .catch(() => {
                setStartError("結果を保存できませんでした");
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
          setStartError("学習を開始できませんでした");
        }
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, questions, router, section.id]);

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
      toast.warning("進捗を保存できませんでした。学習は続けられます");
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
      toast.error("結果を保存できませんでした");
    }
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>問題データがありません</CardTitle>
              <CardDescription>別のセクションを選択してください。</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/">ホームへ戻る</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-700">{section.id}</p>
            <h1 className="text-3xl font-semibold">{section.name}</h1>
          </div>
        </div>

        <Card className="rounded-2xl border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>
              {currentIndex + 1} / {questions.length} 問
            </CardTitle>
            <CardDescription>{currentQuestion.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progressValue} />

            {startError ? (
              <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {startError}
              </p>
            ) : null}

            <h2 className="text-xl font-semibold leading-8">{currentQuestion.question}</h2>

            <div className="grid gap-3">
              {currentQuestion.choices.map((choice) => {
                const answered = Boolean(selectedChoiceId);
                const isSelected = selectedChoiceId === choice.id;
                const isAnswer = currentQuestion.answer === choice.id;

                return (
                  <button
                    key={choice.id}
                    className={cn(
                      "min-h-14 rounded-2xl border bg-white px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-zinc-300",
                      !answered && "hover:border-zinc-900 hover:bg-zinc-50",
                      answered && isAnswer && "border-emerald-600 bg-emerald-50 text-emerald-950",
                      answered && isSelected && !isAnswer && "border-red-500 bg-red-50 text-red-950",
                    )}
                    disabled={(isSignedIn && !attempt) || answered}
                    onClick={() => handleAnswer(choice.id)}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full border font-mono text-sm font-semibold",
                          answered && isAnswer && "border-emerald-600 bg-emerald-100",
                          answered && isSelected && !isAnswer && "border-red-500 bg-red-100",
                          !answered && "border-zinc-300 bg-zinc-100",
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
              <div className="rounded-2xl border bg-zinc-50 p-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <XCircle className="size-5 text-red-600" />
                  )}
                  <p className={cn("font-semibold", isCorrect ? "text-emerald-700" : "text-red-700")}>
                    {isCorrect ? "正解！" : "不正解"}
                  </p>
                </div>
                {!isCorrect ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
                    <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                    正解は {currentQuestion.answer}: {correctChoiceText}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">あなたの選択</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">{selectedChoiceId}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">正解</p>
                    <p className="mt-1 text-base font-semibold text-emerald-900">
                      {currentQuestion.answer}: {correctChoiceText}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 leading-7 text-zinc-700">
                  <CircleCheckBig className="mt-1 size-4 shrink-0 text-zinc-500" />
                  <span>{currentQuestion.explanation}</span>
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="border-t bg-zinc-50/90 py-4 backdrop-blur">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild className="w-full sm:w-auto" variant="outline">
                <Link href="/">ホームへ戻る</Link>
              </Button>
              <Button className="w-full sm:w-auto" disabled={!selectedChoiceId || isSaving} onClick={handleNext}>
                {isSaving ? "保存中..." : isLastQuestion ? "結果を見る" : "次の問題へ"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
