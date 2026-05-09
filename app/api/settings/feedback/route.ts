import { AppError, errorResponse } from "@/lib/server/api-errors";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { createFeedbackSubmission } from "@/lib/server/feedback-repository";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  formatBytes,
  parseFeedbackCategory,
  validateFeedbackMessage,
  validateFeedbackScreenshot,
} from "@/lib/shared/validation";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function getFormFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!value || typeof value === "string") {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const formData = await request.formData();
    const screenshotFile = getFormFile(formData, "screenshot");
    const category = parseFeedbackCategory(getFormString(formData, "category"));
    const messageValidation = validateFeedbackMessage(getFormString(formData, "message"));
    const screenshotValidation = validateFeedbackScreenshot(screenshotFile);

    if (!category) {
      throw new AppError("INVALID_FEEDBACK", 400, "カテゴリを選択してください");
    }

    if (!messageValidation.ok || !messageValidation.value) {
      throw new AppError(
        "INVALID_FEEDBACK",
        400,
        messageValidation.errors[0] ??
          `本文は ${FEEDBACK_MESSAGE_MAX_LENGTH} 文字以内で入力してください`,
      );
    }

    if (!screenshotValidation.ok) {
      throw new AppError(
        "INVALID_FEEDBACK",
        400,
        screenshotValidation.errors[0] ??
          `スクリーンショットは ${formatBytes(FEEDBACK_SCREENSHOT_MAX_BYTES)} 以内の画像を選択してください`,
      );
    }

    const screenshot = screenshotValidation.value
      ? {
          ...screenshotValidation.value,
          base64: Buffer.from(await screenshotFile!.arrayBuffer()).toString("base64"),
        }
      : null;

    const submission = await createFeedbackSubmission({
      userId: user.userId,
      userEmail: user.canonicalEmail,
      userDisplayName: user.displayName,
      category,
      message: messageValidation.value,
      screenshot,
    });

    return Response.json({
      data: {
        id: submission.id,
        createdAt: submission.createdAt,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
