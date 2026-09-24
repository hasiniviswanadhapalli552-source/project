/*
# Create students table for academic performance analytics

1. New Tables
- `students`
  - id (uuid, primary key, auto-generated)
  - student_id (text, unique, not null) — human-readable student identifier like "STU001"
  - name (text, not null) — student's full name
  - gender (text) — "Male", "Female", or "Other"
  - age (integer) — student's age
  - attendance (numeric) — attendance percentage (0-100)
  - assignment_score (numeric) — average assignment score (0-100)
  - internal_marks (numeric) — internal assessment marks (0-100)
  - previous_marks (numeric) — previous semester/year marks (0-100)
  - study_hours (numeric) — hours studied per week
  - final_marks (numeric) — final exam marks (0-100)
  - performance_category (text) — derived category: Excellent/Good/Average/Needs Improvement
  - created_at (timestamptz, default now())
  - user_id (uuid, not null, defaults to auth.uid()) — owner of the record

2. Security
- Enable RLS on `students`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- 4 separate policies for SELECT, INSERT, UPDATE, DELETE.
- user_id defaults to auth.uid() so inserts that omit user_id still satisfy the WITH CHECK.
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  name text NOT NULL,
  gender text,
  age integer,
  attendance numeric,
  assignment_score numeric,
  internal_marks numeric,
  previous_marks numeric,
  study_hours numeric,
  final_marks numeric,
  performance_category text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_students" ON students;
CREATE POLICY "select_own_students" ON students FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_students" ON students;
CREATE POLICY "insert_own_students" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_students" ON students;
CREATE POLICY "update_own_students" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_students" ON students;
CREATE POLICY "delete_own_students" ON students FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
