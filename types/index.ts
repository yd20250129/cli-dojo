export type SectionId =
  | "SEC-01"
  | "SEC-02"
  | "SEC-03"
  | "SEC-04"
  | "SEC-05"
  | "SEC-06";

export type ChoiceId = "A" | "B" | "C" | "D";

export type AttemptStatus = "in_progress" | "completed";

export type Account = {
  id: string;
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

export type Question = {
  id: string;
  sectionId: SectionId;
  category: string;
  command: string;
  question: string;
  choices: Choice[];
  answer: ChoiceId;
  explanation: string;
};

export type SectionAttempt = {
  id: string;
  accountId: string;
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
  accountId: string;
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
