-- Migration: Dynamic Stages + Exercise Groups
-- Run this in Supabase SQL editor

-- Add stages JSONB to sessions (stores ordered [{id, name}] array)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Exercise groups (Rotinas)
CREATE TABLE IF NOT EXISTS exercise_groups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_group_items (
  id          uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid     NOT NULL REFERENCES exercise_groups(id) ON DELETE CASCADE,
  exercise_id uuid     NOT NULL REFERENCES exercises(id)       ON DELETE CASCADE,
  position    smallint NOT NULL DEFAULT 0,
  UNIQUE (group_id, exercise_id)
);

-- RLS
ALTER TABLE exercise_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_group_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON exercise_groups      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON exercise_group_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS exercise_group_items_group_id_idx ON exercise_group_items (group_id);
