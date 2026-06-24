-- Migration: add 'draft' and 'archived' to session_status enum + make week_id nullable
-- Run this in the Supabase SQL editor

ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'archived';

-- Templates (draft sessions) have no week slot
ALTER TABLE sessions ALTER COLUMN week_id DROP NOT NULL;
