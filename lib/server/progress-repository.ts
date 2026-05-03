import { AppError } from "@/lib/server/api-errors";
import { getSql } from "@/lib/server/db";
import {
  getQuestionById,
  getQuestionsBySectionId,
  getSections,
} from "@/lib/shared/questions";
import type {
  AnonymousProgressState,
  AnswerRecord,
  ChoiceId,
  CurrentSectionAttempt,
  MigrateProgressResult,
  ProgressSummary,
  SectionAttempt,
  SectionId,
  SectionProgress,
  SectionResult,
} from "@/types";

type AttemptRow = {
  id: string;
  user_id: string | null;
  section_id: SectionId;
  attempt_no: number;
  status: "in_progress" | "completed";
  score: number;
  total_questions: number;
  started_at: Date | string;
  completed_at: Date | string | null;
};

type AnswerRow = {
  id: string;
  attempt_id: string;
  user_id: string | null;
  section_id: SectionId;
  question_id: string;
  selected_choice_id: ChoiceId;
  correct_choice_id: ChoiceId;
  is_correct: boolean;
  answered_at: Date | string;
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAttempt(row: AttemptRow): SectionAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    sectionId: row.section_id,
    attemptNo: row.attempt_no,
    status: row.status,
    score: row.score,
    totalQuestions: row.total_questions,
    startedAt: toIso(row.started_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
  };
}

function mapAnswer(row: AnswerRow): AnswerRecord {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    userId: row.user_id,
    sectionId: row.section_id,
    questionId: row.question_id,
    selectedChoiceId: row.selected_choice_id,
    correctChoiceId: row.correct_choice_id,
    isCorrect: row.is_correct,
    answeredAt: toIso(row.answered_at),
  };
}

function getTotalQuestions(sectionId: SectionId) {
  return getQuestionsBySectionId(sectionId).length;
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505",
  );
}

export async function getOrCreateCurrentAttempt(params: {
  userId: string;
  sectionId: SectionId;
}): Promise<CurrentSectionAttempt> {
  const sql = getSql();
  const existing = await sql`
    SELECT *
    FROM section_attempts
    WHERE user_id = ${params.userId}
      AND section_id = ${params.sectionId}
      AND status = 'in_progress'
    ORDER BY attempt_no DESC
    LIMIT 1
  `;

  if (existing[0]) {
    const attempt = mapAttempt(existing[0] as AttemptRow);
    return {
      ...attempt,
      answeredQuestionIds: await getAnsweredQuestionIds({
        userId: params.userId,
        attemptId: attempt.id,
      }),
    };
  }

  return createRetryAttempt(params);
}

export async function createRetryAttempt(params: {
  userId: string;
  sectionId: SectionId;
}): Promise<CurrentSectionAttempt> {
  const sql = getSql();
  const totalQuestions = getTotalQuestions(params.sectionId);
  const rows = await sql`
    INSERT INTO section_attempts (
      user_id,
      section_id,
      attempt_no,
      status,
      score,
      total_questions
    )
    VALUES (
      ${params.userId},
      ${params.sectionId},
      COALESCE((
        SELECT MAX(attempt_no) + 1
        FROM section_attempts
        WHERE user_id = ${params.userId}
          AND section_id = ${params.sectionId}
      ), 1),
      'in_progress',
      0,
      ${totalQuestions}
    )
    RETURNING *
  `;

  return {
    ...mapAttempt(rows[0] as AttemptRow),
    answeredQuestionIds: [],
  };
}

async function getAnsweredQuestionIds(params: {
  userId: string;
  attemptId: string;
}) {
  const sql = getSql();
  const rows = await sql`
    SELECT question_id
    FROM answer_records
    WHERE user_id = ${params.userId}
      AND attempt_id = ${params.attemptId}
    ORDER BY answered_at ASC
  `;

  return rows.map((row) => String(row.question_id));
}

export async function saveAnswer(params: {
  userId: string;
  attemptId: string;
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
}) {
  const question = getQuestionById(params.questionId);

  if (!question || question.sectionId !== params.sectionId) {
    throw new AppError("QUESTION_NOT_FOUND", 404);
  }

  const sql = getSql();
  const attempts = await sql`
    SELECT *
    FROM section_attempts
    WHERE id = ${params.attemptId}
      AND user_id = ${params.userId}
      AND section_id = ${params.sectionId}
    LIMIT 1
  `;

  if (!attempts[0]) {
    throw new AppError("ATTEMPT_NOT_FOUND", 404);
  }

  try {
    const rows = await sql`
      INSERT INTO answer_records (
        attempt_id,
        user_id,
        section_id,
        question_id,
        selected_choice_id,
        correct_choice_id,
        is_correct
      )
      VALUES (
        ${params.attemptId},
        ${params.userId},
        ${params.sectionId},
        ${params.questionId},
        ${params.selectedChoiceId},
        ${question.answer},
        ${params.selectedChoiceId === question.answer}
      )
      RETURNING *
    `;

    return mapAnswer(rows[0] as AnswerRow);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("ANSWER_ALREADY_EXISTS", 409);
    }

    throw error;
  }
}

export async function completeAttempt(params: {
  userId: string;
  attemptId: string;
}) {
  const sql = getSql();
  const attempts = await sql`
    SELECT *
    FROM section_attempts
    WHERE id = ${params.attemptId}
      AND user_id = ${params.userId}
    LIMIT 1
  `;

  const attempt = attempts[0] as AttemptRow | undefined;

  if (!attempt) {
    throw new AppError("ATTEMPT_NOT_FOUND", 404);
  }

  const totals = await sql`
    SELECT
      COUNT(*)::int AS answered_count,
      COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct_count
    FROM answer_records
    WHERE attempt_id = ${params.attemptId}
      AND user_id = ${params.userId}
  `;

  const score = Number(totals[0]?.correct_count ?? 0);
  const rows = await sql`
    UPDATE section_attempts
    SET
      status = 'completed',
      score = ${score},
      completed_at = now()
    WHERE id = ${params.attemptId}
      AND user_id = ${params.userId}
    RETURNING *
  `;

  return mapAttempt(rows[0] as AttemptRow);
}

export async function getSectionResult(params: {
  userId: string;
  sectionId: SectionId;
  attemptId?: string;
}): Promise<SectionResult | null> {
  const sql = getSql();
  const attempts = params.attemptId
    ? await sql`
        SELECT *
        FROM section_attempts
        WHERE id = ${params.attemptId}
          AND user_id = ${params.userId}
          AND section_id = ${params.sectionId}
        LIMIT 1
      `
    : await sql`
        SELECT *
        FROM section_attempts
        WHERE user_id = ${params.userId}
          AND section_id = ${params.sectionId}
          AND status = 'completed'
        ORDER BY attempt_no DESC
        LIMIT 1
      `;

  const attempt = attempts[0] as AttemptRow | undefined;

  if (!attempt) {
    return null;
  }

  const answers = await sql`
    SELECT *
    FROM answer_records
    WHERE user_id = ${params.userId}
      AND attempt_id = ${attempt.id}
    ORDER BY answered_at ASC
  `;

  const incorrectAnswers = (answers as AnswerRow[])
    .filter((answer) => !answer.is_correct)
    .map((answer) => {
      const question = getQuestionById(answer.question_id);

      return {
        questionId: answer.question_id,
        question: question?.question ?? "問題データがありません",
        selectedChoiceId: answer.selected_choice_id,
        correctChoiceId: answer.correct_choice_id,
        explanation: question?.explanation ?? "",
      };
    });

  return {
    sectionId: attempt.section_id,
    attemptNo: attempt.attempt_no,
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    correctRate:
      attempt.total_questions === 0 ? 0 : attempt.score / attempt.total_questions,
    incorrectAnswers,
  };
}

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  const sql = getSql();
  const sections = getSections();
  const latestAttempts = await sql`
    SELECT DISTINCT ON (section_id) *
    FROM section_attempts
    WHERE user_id = ${userId}
    ORDER BY section_id, attempt_no DESC
  `;
  const latestBySection = new Map(
    (latestAttempts as AttemptRow[]).map((attempt) => [attempt.section_id, attempt]),
  );

  const aggregateRows = await sql`
    SELECT
      attempt_id,
      COUNT(*)::int AS answered_count,
      COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS correct_count,
      MAX(answered_at) AS latest_answered_at
    FROM answer_records
    WHERE user_id = ${userId}
    GROUP BY attempt_id
  `;
  const aggregateByAttempt = new Map(
    aggregateRows.map((row) => [
      String(row.attempt_id),
      {
        answeredCount: Number(row.answered_count),
        correctCount: Number(row.correct_count),
        latestAnsweredAt: row.latest_answered_at
          ? toIso(row.latest_answered_at as Date | string)
          : null,
      },
    ]),
  );

  const sectionProgress: SectionProgress[] = sections.map((section) => {
    const attempt = latestBySection.get(section.id);
    const aggregate = attempt ? aggregateByAttempt.get(attempt.id) : null;
    const answeredCount = aggregate?.answeredCount ?? 0;
    const correctCount = aggregate?.correctCount ?? 0;
    const totalQuestions = getTotalQuestions(section.id);

    return {
      sectionId: section.id,
      answeredCount,
      correctCount,
      totalQuestions,
      correctRate: answeredCount === 0 ? 0 : correctCount / answeredCount,
      latestAttemptNo: attempt?.attempt_no ?? null,
      latestAnsweredAt: aggregate?.latestAnsweredAt ?? null,
      isCompleted: answeredCount >= totalQuestions,
      isPerfect:
        attempt?.status === "completed" &&
        totalQuestions > 0 &&
        correctCount === totalQuestions,
    };
  });

  const totalAnsweredCount = sectionProgress.reduce(
    (sum, section) => sum + section.answeredCount,
    0,
  );
  const totalCorrectCount = sectionProgress.reduce(
    (sum, section) => sum + section.correctCount,
    0,
  );
  const totalQuestionCount = sections.reduce(
    (sum, section) => sum + getTotalQuestions(section.id),
    0,
  );

  return {
    totalAnsweredCount,
    totalCorrectCount,
    totalQuestionCount,
    overallProgressRate:
      totalQuestionCount === 0 ? 0 : totalAnsweredCount / totalQuestionCount,
    overallCorrectRate:
      totalAnsweredCount === 0 ? 0 : totalCorrectCount / totalAnsweredCount,
    sections: sectionProgress,
  };
}

function getAnonymousAnswerEntries(
  sectionId: SectionId,
  anonymousProgress: AnonymousProgressState,
) {
  const sectionState = anonymousProgress[sectionId];

  if (!sectionState) {
    return [];
  }

  return getQuestionsBySectionId(sectionId).flatMap((question) => {
    const selectedChoiceId = sectionState.answers[question.id];

    if (!selectedChoiceId) {
      return [];
    }

    return [{ questionId: question.id, selectedChoiceId }];
  });
}

export async function migrateAnonymousProgressIfNeeded(params: {
  userId: string;
  anonymousProgress: AnonymousProgressState;
}): Promise<MigrateProgressResult> {
  const sections = getSections();
  const answerEntriesBySection = sections.map((section) => ({
    sectionId: section.id,
    answers: getAnonymousAnswerEntries(section.id, params.anonymousProgress),
  }));
  const hasAnonymousProgress = answerEntriesBySection.some(({ answers }) => answers.length > 0);

  if (!hasAnonymousProgress) {
    return { migrated: false, reason: "no_anonymous_progress" };
  }

  const sql = getSql();
  const existingAccountProgress = await sql`
    SELECT 1
    FROM section_attempts
    WHERE user_id = ${params.userId}
    LIMIT 1
  `;

  if (existingAccountProgress[0]) {
    return { migrated: false, reason: "account_progress_exists" };
  }

  for (const { sectionId, answers } of answerEntriesBySection) {
    if (answers.length === 0) {
      continue;
    }

    const attempt = await createRetryAttempt({
      userId: params.userId,
      sectionId,
    });

    for (const answer of answers) {
      await saveAnswer({
        userId: params.userId,
        attemptId: attempt.id,
        sectionId,
        questionId: answer.questionId,
        selectedChoiceId: answer.selectedChoiceId,
      });
    }

    if (answers.length >= getTotalQuestions(sectionId)) {
      await completeAttempt({
        userId: params.userId,
        attemptId: attempt.id,
      });
    }
  }

  return { migrated: true, reason: "migrated" };
}
