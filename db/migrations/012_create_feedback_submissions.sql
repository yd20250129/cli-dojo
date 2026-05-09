CREATE TABLE IF NOT EXISTS feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email text,
  user_display_name text,
  category text NOT NULL CHECK (category IN ('bug', 'feature_request', 'other')),
  message text NOT NULL,
  screenshot_filename text,
  screenshot_content_type text,
  screenshot_size_bytes integer CHECK (
    screenshot_size_bytes IS NULL OR screenshot_size_bytes >= 0
  ),
  screenshot_base64 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_submissions_screenshot_fields_check CHECK (
    (
      screenshot_filename IS NULL
      AND screenshot_content_type IS NULL
      AND screenshot_size_bytes IS NULL
      AND screenshot_base64 IS NULL
    ) OR (
      screenshot_filename IS NOT NULL
      AND screenshot_content_type IS NOT NULL
      AND screenshot_size_bytes IS NOT NULL
      AND screenshot_base64 IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_id_created_at
  ON feedback_submissions (user_id, created_at DESC);
