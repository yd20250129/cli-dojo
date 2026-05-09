import { getSql } from "@/lib/server/db";
import { AppError } from "@/lib/server/api-errors";

type CreateFeedbackSubmissionParams = {
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  category: "bug" | "feature_request" | "other";
  message: string;
  screenshot:
    | {
        filename: string;
        contentType: string;
        sizeBytes: number;
        base64: string;
      }
    | null;
};

export async function createFeedbackSubmission(params: CreateFeedbackSubmissionParams) {
  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO feedback_submissions (
        user_id,
        user_email,
        user_display_name,
        category,
        message,
        screenshot_filename,
        screenshot_content_type,
        screenshot_size_bytes,
        screenshot_base64
      )
      VALUES (
        ${params.userId},
        ${params.userEmail},
        ${params.userDisplayName},
        ${params.category},
        ${params.message},
        ${params.screenshot?.filename ?? null},
        ${params.screenshot?.contentType ?? null},
        ${params.screenshot?.sizeBytes ?? null},
        ${params.screenshot?.base64 ?? null}
      )
      RETURNING id, created_at
    `;

    return {
      id: String(rows[0].id),
      createdAt:
        rows[0].created_at instanceof Date
          ? rows[0].created_at.toISOString()
          : String(rows[0].created_at),
    };
  } catch {
    throw new AppError("FEEDBACK_SAVE_FAILED", 500);
  }
}
