CREATE TABLE IF NOT EXISTS section_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      uuid NOT NULL,
  section_id      varchar(10) NOT NULL CHECK (section_id IN ('SEC-01', 'SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06')),
  attempt_no      integer NOT NULL CHECK (attempt_no > 0),
  status          text NOT NULL CHECK (status IN ('in_progress', 'completed')),
  score           integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  total_questions integer NOT NULL DEFAULT 10 CHECK (total_questions > 0),
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  UNIQUE (learner_id, section_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_section_attempts_learner_id
  ON section_attempts(learner_id);

CREATE INDEX IF NOT EXISTS idx_section_attempts_learner_section
  ON section_attempts(learner_id, section_id);

CREATE TABLE IF NOT EXISTS answer_records (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id         uuid NOT NULL REFERENCES section_attempts(id) ON DELETE CASCADE,
  learner_id         uuid NOT NULL,
  section_id         varchar(10) NOT NULL CHECK (section_id IN ('SEC-01', 'SEC-02', 'SEC-03', 'SEC-04', 'SEC-05', 'SEC-06')),
  question_id        varchar(20) NOT NULL,
  selected_choice_id char(1) NOT NULL CHECK (selected_choice_id IN ('A', 'B', 'C', 'D')),
  correct_choice_id  char(1) NOT NULL CHECK (correct_choice_id IN ('A', 'B', 'C', 'D')),
  is_correct         boolean NOT NULL,
  answered_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answer_records_learner_id
  ON answer_records(learner_id);

CREATE INDEX IF NOT EXISTS idx_answer_records_attempt_id
  ON answer_records(attempt_id);

CREATE INDEX IF NOT EXISTS idx_answer_records_learner_section
  ON answer_records(learner_id, section_id);
