export type SectionId =
  | "SEC-01"
  | "SEC-02"
  | "SEC-03"
  | "SEC-04"
  | "SEC-05"
  | "SEC-06";

export type ChoiceId = "A" | "B" | "C" | "D";
export type Locale = "ja" | "en";
export type Region = "JP" | "US";
export type Currency = "JPY" | "USD";
export type CategoryKey = string;
export type LegalDocumentKind = "terms" | "privacy";

export type UserPreferences = {
  locale: Locale;
  region: Region;
  timezone: string;
  currency: Currency;
};

export type AttemptStatus = "in_progress" | "completed";

export type AnonymousSectionProgress = {
  answers: Record<string, ChoiceId>;
  latestAnsweredAt: string | null;
};

export type AnonymousProgressState = Partial<Record<SectionId, AnonymousSectionProgress>>;

export type Account = UserPreferences & {
  id: string;
  userId: string;
  clerkUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type Section = {
  id: SectionId;
  name: string;
  description: string;
  order: number;
  questionCount: number;
};

export type Choice = {
  id: ChoiceId;
  text: string;
};

export type QuestionDef = {
  id: string;
  sectionId: SectionId;
  command: string;
  answer: ChoiceId;
  choiceIds: readonly ChoiceId[];
};

export type LocalizedQuestion = {
  categoryKey: CategoryKey;
  question: string;
  choices: Record<ChoiceId, string>;
  explanation: string;
};

export type QuestionLocaleMap = Record<string, LocalizedQuestion>;

export type SectionDef = {
  id: SectionId;
  order: number;
  questionCount: number;
};

export type LocalizedSection = {
  name: string;
  description: string;
};

export type SectionLocaleMap = Record<SectionId, LocalizedSection>;

export type Question = {
  id: string;
  sectionId: SectionId;
  categoryKey: CategoryKey;
  category: string;
  command: string;
  question: string;
  choices: Choice[];
  answer: ChoiceId;
  explanation: string;
};

export type SectionAttempt = {
  id: string;
  userId: string | null;
  accountId: string | null;
  sectionId: SectionId;
  attemptNo: number;
  status: AttemptStatus;
  score: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
};

export type CurrentSectionAttempt = SectionAttempt & {
  answeredQuestionIds: string[];
};

export type AnswerRecord = {
  id: string;
  attemptId: string;
  userId: string | null;
  accountId: string | null;
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
  correctChoiceId: ChoiceId;
  isCorrect: boolean;
  answeredAt: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_LEARNER_ID"
  | "INVALID_SECTION"
  | "QUESTION_NOT_FOUND"
  | "QUESTION_DATA_INVALID"
  | "ATTEMPT_NOT_FOUND"
  | "ANSWER_ALREADY_EXISTS"
  | "PROGRESS_FETCH_FAILED"
  | "PROGRESS_SAVE_FAILED"
  | "DB_ERROR"
  | "UNKNOWN";

export type ApiErrorResponse = {
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export type CreateAttemptRequest = {
  sectionId: SectionId;
  retry?: boolean;
};

export type SaveAnswerRequest = {
  attemptId: string;
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
};

export type MigrateAnonymousProgressRequest = {
  anonymousProgress: AnonymousProgressState;
};

export type MigrateProgressResultReason =
  | "migrated"
  | "account_progress_exists"
  | "no_legacy_progress"
  | "no_anonymous_progress";

export type MigrateProgressResult = {
  migrated: boolean;
  reason: MigrateProgressResultReason;
};

export type IncorrectAnswer = {
  questionId: string;
  question: string;
  selectedChoiceId: ChoiceId;
  correctChoiceId: ChoiceId;
  explanation: string;
};

export type SectionResult = {
  sectionId: SectionId;
  attemptNo: number;
  score: number;
  totalQuestions: number;
  correctRate: number;
  incorrectAnswers: IncorrectAnswer[];
};

export type SectionProgress = {
  sectionId: SectionId;
  answeredCount: number;
  correctCount: number;
  totalQuestions: number;
  correctRate: number;
  latestAttemptNo: number | null;
  latestAnsweredAt: string | null;
  isCompleted: boolean;
  isPerfect: boolean;
};

export type ProgressSummary = {
  totalAnsweredCount: number;
  totalCorrectCount: number;
  totalQuestionCount: number;
  overallProgressRate: number;
  overallCorrectRate: number;
  sections: SectionProgress[];
};
