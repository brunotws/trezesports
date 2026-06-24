-- 0007_instance_overrides.sql
-- Adds per-instance duration overrides and allows repeated exercises in routines.

ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS custom_duration real;

ALTER TABLE exercise_group_items
  ADD COLUMN IF NOT EXISTS custom_duration real;

-- Allow the same exercise to appear multiple times in a routine
ALTER TABLE exercise_group_items
  DROP CONSTRAINT IF EXISTS exercise_group_items_group_id_exercise_id_key;
