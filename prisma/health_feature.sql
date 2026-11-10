-- Additive only: new tables for health questions and anonymous stories.
CREATE TYPE health_question_status AS ENUM ('PENDING','ASSIGNED','ANSWERED','CLOSED');
CREATE TYPE anonymous_story_status AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE health_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(150) NOT NULL,
  telegram_id bigint UNIQUE,
  category_id uuid REFERENCES health_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES health_categories(id),
  question_text text NOT NULL,
  status health_question_status NOT NULL DEFAULT 'PENDING',
  assigned_doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);
CREATE INDEX health_questions_status_idx ON health_questions(status);

CREATE TABLE health_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES health_questions(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  answer_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anonymous on purpose: no link to students.
CREATE TABLE anonymous_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES health_categories(id),
  story_text text NOT NULL,
  status anonymous_story_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bot_states (
  telegram_id bigint PRIMARY KEY,
  state varchar(50) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO health_categories (name, sort_order) VALUES
  ('Menstrual health', 1),
  ('Reproductive health', 2),
  ('Sexual health', 3),
  ('Mental health', 4),
  ('Nutrition', 5),
  ('Skin & hygiene', 6),
  ('Other', 7);
