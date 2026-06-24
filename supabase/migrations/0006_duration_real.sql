-- Allow fractional minutes (e.g. 0.5 = 30 seconds)
ALTER TABLE exercises ALTER COLUMN duration_min TYPE real;
