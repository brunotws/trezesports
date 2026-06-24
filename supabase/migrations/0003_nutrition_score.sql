-- Migration: Add nutrition_score to daily_wellness
-- Run this in the Supabase SQL editor

ALTER TABLE daily_wellness ADD COLUMN IF NOT EXISTS nutrition_score smallint CHECK (nutrition_score BETWEEN 1 AND 5);
