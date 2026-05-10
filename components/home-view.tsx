"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, CircleGauge, Sparkles, TrendingUp } from "lucide-react";

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
  getAnonymousProgressSnapshot,
  subscribeAnonymousProgress,
} from "@/lib/client/anonymous-progress";
import { fetchProgress } from "@/lib/client/api";
import type { Locale, ProgressSummary, Section } from "@/types";

type HomeViewProps = {
  locale: Locale;
  sections: Section[];
};

function percent(value: number) {
  return Math.round(value * 100);
}

function openSignInModal() {
  window.dispatchEvent(
    new CustomEvent("cli-dojo:open-auth", {
      detail: { mode: "sign-in" as const },
    }),
  );
}

export function HomeView({ locale, sections }: HomeViewProps) {
  const { isLoaded, userId } = useAuth();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");
  const isSignedIn = isLoaded && Boolean(userId);
  const t = getTranslator(locale);

  useEffect(() => {
    const translate = getTranslator(locale);

    if (!isSignedIn) {
      return;
    }

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
          setError(translate("home.errors.progressFetchFailed"));
        }
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, locale]);

  const anonymousProgress = useSyncExternalStore(
    subscribeAnonymousProgress,
    getAnonymousProgressSnapshot,
    () => null,
  );

  const hasAnonymousProgress = Boolean(
    anonymousProgress && anonymousProgress.totalAnsweredCount > 0,
  );
  const hasAccountProgress = Boolean(progress && progress.totalAnsweredCount > 0);
  const usesAnonymousFallback = isSignedIn && hasAnonymousProgress && !hasAccountProgress;
  const visibleProgress = isSignedIn
    ? usesAnonymousFallback
      ? anonymousProgress
      : progress
    : isLoaded
      ? anonymousProgress
      : null;
  const visibleError = isSignedIn && !usesAnonymousFallback ? error : "";

  const progressBySection = useMemo(() => {
    return new Map(visibleProgress?.sections.map((section) => [section.sectionId, section]));
  }, [visibleProgress]);

  const totalQuestions = visibleProgress?.totalQuestionCount ?? sections.reduce((sum, section) => sum + section.questionCount, 0);
  const answered = visibleProgress?.totalAnsweredCount ?? 0;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
        style={{ backgroundImage: "radial-gradient(circle at top left, var(--gradient-hero-teal), transparent 35%), radial-gradient(circle at top right, var(--gradient-hero-dark), transparent 28%)" }}
      />
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:py-10">
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex h-full flex-col justify-center space-y-6 lg:pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" />
                {t("home.badges.commandLearner")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
                <CheckCircle2 className="size-3.5" />
                {t("home.badges.recordSupport")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
                <CircleGauge className="size-3.5" />
                {t("home.badges.sectionCount")}
              </span>
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              {t("home.hero.title")
                .split(/\\n|\n/)
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    {index === 0 ? <br /> : null}
                  </span>
                ))}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("home.hero.description")}
            </p>
          </div>
          <Card className="self-start border-border bg-surface-raised shadow-sm">
            <CardHeader>
              <CardTitle>{t("home.summary.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {answered > 0
                  ? t("home.summary.answered", { answered, total: totalQuestions })
                  : isSignedIn
                    ? t("home.summary.emptySignedIn")
                    : t("home.summary.emptyAnonymous")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={percent(visibleProgress?.overallProgressRate ?? 0)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-center gap-3.5">
                  <TrendingUp className="size-8 shrink-0 text-cta-warm-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("home.summary.progressRate")}</p>
                    <p className="text-2xl font-semibold">{percent(visibleProgress?.overallProgressRate ?? 0)}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 shrink-0 text-cta-warm-border" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("home.summary.correctRate")}</p>
                    <p className="text-2xl font-semibold">{percent(visibleProgress?.overallCorrectRate ?? 0)}%</p>
                  </div>
                </div>
              </div>
              {visibleError ? <p className="text-sm text-status-error">{visibleError}</p> : null}
            </CardContent>
            <CardFooter>
              {isSignedIn ? (
                <Button asChild variant="outline" className="w-full border-2 border-primary/30 bg-card text-primary hover:bg-primary/5">
                  <Link href="/progress">{t("home.summary.details")}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-cta-warm-border bg-cta-warm-bg text-cta-warm-text hover:bg-cta-warm-bg/80"
                  onClick={openSignInModal}
                >
                  {t("home.summary.signInPrompt")}
                </Button>
              )}
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
              <Card
                key={section.id}
                className="flex h-full flex-col border-border bg-surface-raised shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle>{section.name}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {t("home.sectionCard.answered", {
                        answered: answeredCount,
                        total: section.questionCount,
                      })}
                    </span>
                    <span>{t("home.sectionCard.correctRate", { rate: correctRate })}</span>
                  </div>
                  <Progress value={(answeredCount / section.questionCount) * 100} />
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/section/${section.id}`}>
                      {answeredCount > 0 && !completed
                        ? t("home.sectionCard.resume")
                        : t("home.sectionCard.start")}
                      <ArrowRight className="size-4" />
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
