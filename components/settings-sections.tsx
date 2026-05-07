"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={showAvatar ? "flex items-center gap-4" : "space-y-4"}>
          {showAvatar ? (
            <UserAvatar
              imageUrl={imageUrl}
              name={initialName}
              className="size-16 shrink-0"
              sizes="64px"
            />
          ) : null}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
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
                <div className="font-medium text-foreground">{user?.fullName || initialName}</div>
                <Button size="sm" variant="outline" onClick={() => setIsEditingName(true)}>
                  {t("settings.profile.editName")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 border-t border-border pt-4">
          <div className="text-sm font-medium text-muted-foreground">
            {t("settings.profile.emailLabel")}
          </div>
          <div className="text-foreground">{email}</div>
        </div>

        <div className="rounded-md border border-border bg-surface-subtle p-3 text-sm text-muted-foreground">
          {t("settings.profile.providerNotice")}
        </div>
      </CardContent>
    </Card>
  );
}
