"use client";

import type React from "react";
import { ImageUp, Loader2, Paperclip, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { submitFeedback } from "@/lib/client/api";
import { getTranslator } from "@/lib/i18n";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  formatBytes,
  validateFeedbackScreenshot,
} from "@/lib/shared/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackCategory, Locale } from "@/types";

type SettingsFeedbackFormProps = {
  locale: Locale;
  onSubmitted?: () => void;
};

const categories: FeedbackCategory[] = ["bug", "feature_request", "other"];

export function SettingsFeedbackForm({
  locale,
  onSubmitted,
}: SettingsFeedbackFormProps) {
  const t = getTranslator(locale);
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setNextScreenshot = (nextFile: File | null) => {
    const validation = validateFeedbackScreenshot(nextFile);

    if (!validation.ok) {
      setScreenshotError(validation.errors[0] ?? t("settings.feedback.form.submitError"));
      return;
    }

    setScreenshotError("");
    setScreenshot(nextFile && nextFile.size ? nextFile : null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await submitFeedback({ category, message, screenshot });
      setCategory("bug");
      setMessage("");
      setScreenshot(null);
      setScreenshotError("");
      toast.success(t("settings.feedback.form.submitSuccess"));
      onSubmitted?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("settings.feedback.form.submitError");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setNextScreenshot(nextFile);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextFile = event.dataTransfer.files?.[0] ?? null;
    setNextScreenshot(nextFile);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLButtonElement>) => {
    if (isSubmitting) {
      return;
    }

    const imageItem = Array.from(event.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );

    const nextFile = imageItem?.getAsFile() ?? null;

    if (!nextFile) {
      return;
    }

    event.preventDefault();
    setNextScreenshot(nextFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.feedback.form.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="feedback-category">
            {t("settings.feedback.form.categoryLabel")}
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {categories.map((value) => (
              <Button
                key={value}
                type="button"
                variant={category === value ? "default" : "outline"}
                onClick={() => setCategory(value)}
                disabled={isSubmitting}
                className="justify-center"
              >
                {t(`settings.feedback.form.categories.${value}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="feedback-message">
            {t("settings.feedback.form.messageLabel")}
          </label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
            disabled={isSubmitting}
            placeholder={t("settings.feedback.form.messagePlaceholder")}
          />
          <div className="text-right text-xs text-muted-foreground">
            {message.length} / {FEEDBACK_MESSAGE_MAX_LENGTH}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="feedback-screenshot">
            {t("settings.feedback.form.screenshotLabel")}
          </label>
          <input
            ref={fileInputRef}
            id="feedback-screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isSubmitting}
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onPaste={handlePaste}
            disabled={isSubmitting}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-6 text-center transition-colors hover:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Upload className="size-4 text-muted-foreground" />
              <span>{t("settings.feedback.form.selectScreenshot")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageUp className="size-4" />
              <span>{t("settings.feedback.form.screenshotHelp")}</span>
            </div>
          </button>
          {screenshotError ? (
            <div className="text-sm text-[var(--status-error-text-strong)]">{screenshotError}</div>
          ) : null}
          {screenshot ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-subtle px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <span className="truncate">{screenshot.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(screenshot.size)}
                </div>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={t("settings.feedback.form.removeScreenshot")}
                onClick={() => {
                  setScreenshot(null);
                  setScreenshotError("");
                }}
                disabled={isSubmitting}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="text-sm leading-6 text-muted-foreground">
          {t("settings.feedback.form.notice")}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t("settings.feedback.form.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
