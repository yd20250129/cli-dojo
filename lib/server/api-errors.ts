import type { AppErrorCode } from "@/types";

const messages: Record<AppErrorCode, string> = {
  UNAUTHORIZED: "再ログインしてください",
  INVALID_SECTION: "セクションが見つかりません",
  QUESTION_NOT_FOUND: "問題データがありません",
  QUESTION_DATA_INVALID: "問題データに不整合があります",
  ATTEMPT_NOT_FOUND: "学習結果が見つかりません",
  ANSWER_ALREADY_EXISTS: "この問題は回答済みです",
  PROGRESS_FETCH_FAILED: "進捗を読み込めませんでした",
  PROGRESS_SAVE_FAILED: "進捗を保存できませんでした。学習は続けられます",
  DB_ERROR: "データベース処理に失敗しました",
  UNKNOWN: "エラーが発生しました",
};

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly status: number,
    message = messages[code],
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return Response.json(
    { error: { code: "UNKNOWN", message: messages.UNKNOWN } },
    { status: 500 },
  );
}

export function requireJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("UNKNOWN", 400, "リクエスト形式が正しくありません");
  }

  return value as Record<string, unknown>;
}
