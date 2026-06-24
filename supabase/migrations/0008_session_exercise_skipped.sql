-- 0008_session_exercise_skipped.sql
-- Tracks exercises explicitly skipped during a live session.
-- Skipped exercises are excluded from planned-load calculations.

ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;
