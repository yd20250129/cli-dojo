"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, FileText, Loader2, MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { getTranslator } from "@/lib/i18n";
import { getLegalUrl } from "@/lib/i18n/legal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/types";

type SettingsSectionsProps = {
  locale: Locale;
  imageUrl: string;
  name: string;
  email: string;
  showAvatar?: boolean;
};

export function SettingsSections({
  locale,
  imageUrl,
  name: initialName,
  email,
  showAvatar = true,
}: SettingsSectionsProps) {
  const t = getTranslator(locale);
  const { user } = useUser();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(initialName);
  const [isSavingName, setIsSavingName] = useState(false);

  const termsUrl = getLegalUrl("terms", locale, "JP");

  const handleSaveName = async () => {
    if (!user) {
      return;
    }

    setIsSavingName(true);

    try {
      const parts = editedName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      await user.update({ firstName, lastName });
      toast.success(t("settings.profile.nameUpdated"));
      setIsEditingName(false);
    } catch {
      toast.error(t("settings.profile.nameUpdateFailed"));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleFeedbackSelection = () => {
    toast.success(t("settings.feedbackSent"));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={showAvatar ? "flex items-center gap-4" : "space-y-4"}>
            {showAvatar ? (
              <img
                src={imageUrl}
                alt={initialName}
                className="size-16 shrink-0 rounded-full border border-zinc-200 bg-zinc-100"
              />
            ) : null}
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-zinc-500">
                {t("settings.profile.nameLabel")}
              </div>
              {isEditingName ? (
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                    className="h-8 max-w-[260px]"
                    disabled={isSavingName}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
                      {t("settings.profile.saveName")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(user?.fullName || initialName);
                      }}
                      disabled={isSavingName}
                    >
                      {t("settings.profile.cancelEdit")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-zinc-900">{user?.fullName || initialName}</div>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingName(true)}>
                    {t("settings.profile.editName")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 border-t border-zinc-100 pt-4">
            <div className="text-sm font-medium text-zinc-500">
              {t("settings.profile.emailLabel")}
            </div>
            <div className="text-zinc-900">{email}</div>
          </div>

          <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-600">
            {t("settings.profile.providerNotice")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.general.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-100">
            <Link
              href={termsUrl}
              className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-zinc-200 bg-background p-2 text-zinc-600">
                  <FileText className="size-4" />
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {t("settings.general.terms")}
                </span>
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </Link>
            <button
              type="button"
              onClick={handleFeedbackSelection}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-zinc-200 bg-background p-2 text-zinc-600">
                  <MessageSquare className="size-4" />
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {t("settings.general.feedback")}
                </span>
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
