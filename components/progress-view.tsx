"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/i18n/format";
import { getTranslator } from "@/lib/i18n";
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
import type { Locale, ProgressSummary, Section } from "@/types";

type ProgressViewProps = {
  locale: Locale;
  sections: Section[];
  timezone: string;
};

function percent(value: number) {
  return Math.round(value * 100);
}

function getStatusMeta(params: {
  isPerfect?: boolean;
  isCompleted?: boolean;
  answeredCount: number;
  t: ReturnType<typeof getTranslator>;
}) {
  if (params.isPerfect) {
    return {
      label: params.t("progress.status.perfect"),
      className: "bg-emerald-100 text-emerald-800",
    };
  }

  if (params.isCompleted) {
    return {
      label: params.t("progress.status.completed"),
      className: "bg-sky-100 text-sky-800",
    };
  }

  if (params.answeredCount > 0) {
    return {
      label: params.t("progress.status.inProgress"),
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: params.t("progress.status.notStarted"),
    className: "bg-zinc-100 text-zinc-600",
  };
}

export function ProgressView({ locale, sections, timezone }: ProgressViewProps) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");
  const t = getTranslator(locale);

  useEffect(() => {
    const translate = getTranslator(locale);

    fetchProgress()
      .then((data) => {
        setProgress(data);
        setError("");
      })
      .catch(() => {
        setError(translate("progress.errors.fetchFailed"));
      });
  }, [locale]);

  const progressBySection = useMemo(() => {
    return new Map(progress?.sections.map((section) => [section.sectionId, section]));
  }, [progress]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-700">{t("progress.eyebrow")}</p>
            <h1 className="text-3xl font-semibold">{t("progress.title")}</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{percent(progress?.overallProgressRate ?? 0)}%</CardTitle>
                <CardDescription>{t("progress.stats.progressRate")}</CardDescription>
              </div>
              <div className="space-y-1 text-right">
                <CardTitle>
                  {progress?.totalAnsweredCount ?? 0} / {progress?.totalQuestionCount ?? 118}
                </CardTitle>
                <CardDescription>{t("progress.stats.answered")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={percent(progress?.overallProgressRate ?? 0)} />
            </CardContent>
          </Card>
          <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>{percent(progress?.overallCorrectRate ?? 0)}%</CardTitle>
              <CardDescription>{t("progress.stats.correctRate")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={percent(progress?.overallCorrectRate ?? 0)} />
            </CardContent>
          </Card>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="md:hidden">
          <div className="px-1 pb-4">
            <h2 className="text-lg font-semibold tracking-tight">{t("progress.section.title")}</h2>
            <p className="text-sm text-zinc-500">{t("progress.section.description")}</p>
          </div>
          <div className="space-y-3">
            {sections.map((section) => {
              const item = progressBySection.get(section.id);
              const answered = item?.answeredCount ?? 0;
              const correct = item?.correctCount ?? 0;
              const correctRate = percent(item?.correctRate ?? 0);
              const status = getStatusMeta({
                isPerfect: item?.isPerfect,
                isCompleted: item?.isCompleted,
                answeredCount: answered,
                t,
              });

              return (
                <div key={section.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{section.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-zinc-600">
                      <span>
                        {t("progress.card.answered", {
                          answered,
                          total: section.questionCount,
                        })}
                      </span>
                      <span>{t("progress.card.correctRate", { rate: correctRate })}</span>
                    </div>
                    <Progress value={(answered / section.questionCount) * 100} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-zinc-500">{t("progress.stats.answered")}</p>
                      <p className="mt-1 text-lg font-semibold">{answered}</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <p className="text-zinc-500">{t("progress.section.headers.correct")}</p>
                      <p className="mt-1 text-lg font-semibold">{correct}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="hidden border-zinc-200/80 bg-white/90 shadow-sm md:block">
          <CardHeader>
            <CardTitle>{t("progress.section.title")}</CardTitle>
            <CardDescription>{t("progress.section.description")}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-zinc-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">{t("progress.section.headers.section")}</th>
                  <th className="py-3 pr-4 font-medium">{t("progress.section.headers.answered")}</th>
                  <th className="py-3 pr-4 font-medium">{t("progress.section.headers.correct")}</th>
                  <th className="py-3 pr-4 font-medium">{t("progress.section.headers.correctRate")}</th>
                  <th className="py-3 pr-4 font-medium">{t("progress.section.headers.latestAnsweredAt")}</th>
                  <th className="py-3 font-medium">{t("progress.section.headers.status")}</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => {
                  const item = progressBySection.get(section.id);
                  const answered = item?.answeredCount ?? 0;
                  const correct = item?.correctCount ?? 0;
                  const status = getStatusMeta({
                    isPerfect: item?.isPerfect,
                    isCompleted: item?.isCompleted,
                    answeredCount: answered,
                    t,
                  });

                  return (
                    <tr key={section.id} className="border-b last:border-0">
                      <td className="py-4 pr-4 font-medium">{section.name}</td>
                      <td className="py-4 pr-4">
                        {answered} / {section.questionCount}
                      </td>
                      <td className="py-4 pr-4">{correct}</td>
                      <td className="py-4 pr-4">{percent(item?.correctRate ?? 0)}%</td>
                      <td className="py-4 pr-4">
                        {formatDate(item?.latestAnsweredAt ?? null, locale, timezone)}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
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
            <Link href="/">{t("app.common.backHome")}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
