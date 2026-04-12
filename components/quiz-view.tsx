"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  completeAttempt,
  saveAnswer,
  startAttempt,
} from "@/lib/client/api";
import { cn } from "@/lib/utils";
import type { ChoiceId, Question, Section, SectionAttempt } from "@/types";

type QuizViewProps = {
  section: Section;
  questions: Question[];
};

export function QuizView({ section, questions }: QuizViewProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<SectionAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<ChoiceId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startError, setStartError] = useState("");

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCorrect = selectedChoiceId === currentQuestion?.answer;
  const progressValue = ((currentIndex + (selectedChoiceId ? 1 : 0)) / questions.length) * 100;

  useEffect(() => {
    let active = true;

    startAttempt(section.id)
      .then((data) => {
        if (active) {
          setAttempt(data);
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
  }, [section.id]);

  const correctChoiceText = useMemo(() => {
    return currentQuestion?.choices.find((choice) => choice.id === currentQuestion.answer)?.text ?? "";
  }, [currentQuestion]);

  async function handleAnswer(choiceId: ChoiceId) {
    if (!attempt || selectedChoiceId || !currentQuestion) {
      return;
    }

    setSelectedChoiceId(choiceId);
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
    if (!attempt) {
      return;
    }

    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      setSelectedChoiceId(null);
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
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-700">{section.id}</p>
            <h1 className="text-3xl font-semibold">{section.name}</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>
              {currentIndex + 1} / {questions.length} 問
            </CardTitle>
            <CardDescription>{currentQuestion.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progressValue} />

            {startError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {startError}
              </p>
            ) : null}

            <div className="space-y-3">
              <p className="font-mono text-sm text-zinc-500">{currentQuestion.command}</p>
              <h2 className="text-xl font-semibold leading-8">{currentQuestion.question}</h2>
            </div>

            <div className="grid gap-3">
              {currentQuestion.choices.map((choice) => {
                const answered = Boolean(selectedChoiceId);
                const isSelected = selectedChoiceId === choice.id;
                const isAnswer = currentQuestion.answer === choice.id;

                return (
                  <button
                    key={choice.id}
                    className={cn(
                      "min-h-14 rounded-lg border bg-white px-4 py-3 text-left text-base transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-zinc-300",
                      !answered && "hover:border-zinc-900",
                      answered && isAnswer && "border-emerald-600 bg-emerald-50 text-emerald-950",
                      answered && isSelected && !isAnswer && "border-red-500 bg-red-50 text-red-950",
                    )}
                    disabled={!attempt || answered}
                    onClick={() => handleAnswer(choice.id)}
                    type="button"
                  >
                    <span className="mr-3 font-mono font-semibold">{choice.id}</span>
                    {choice.text}
                  </button>
                );
              })}
            </div>

            {selectedChoiceId ? (
              <div className="rounded-lg border bg-white p-4">
                <p className={cn("font-semibold", isCorrect ? "text-emerald-700" : "text-red-700")}>
                  {isCorrect ? "正解！" : "不正解"}
                </p>
                {!isCorrect ? (
                  <p className="mt-2 text-sm text-zinc-600">
                    正解は {currentQuestion.answer}: {correctChoiceText}
                  </p>
                ) : null}
                <p className="mt-3 leading-7 text-zinc-700">{currentQuestion.explanation}</p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-4xl justify-between gap-3 border bg-white/95 backdrop-blur">
            <p className="text-sm text-zinc-500">{isSaving ? "保存中..." : " "}</p>
            <Button disabled={!selectedChoiceId || isSaving} onClick={handleNext}>
              {isLastQuestion ? "結果を見る" : "次の問題へ"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
