-- =========================================================
-- 0010 — Energy v2: intensity_level, is_regenerative, recovery_bonus
-- Executar no Supabase SQL Editor
-- =========================================================

-- 1. intensity_level on games
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS intensity_level smallint DEFAULT 3
  CHECK (intensity_level BETWEEN 1 AND 5);

-- 2. is_regenerative on exercises
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS is_regenerative boolean NOT NULL DEFAULT false;

-- 3. recovery_bonus on session_athletes
ALTER TABLE session_athletes
  ADD COLUMN IF NOT EXISTS recovery_bonus real DEFAULT 0;

-- 4. Update fn_compute_game_srpe: use intensity_level × duration_min (PSE stays as subjective feedback only)
CREATE OR REPLACE FUNCTION fn_compute_game_srpe()
RETURNS TRIGGER AS $$
DECLARE v_intensity smallint;
BEGIN
  SELECT COALESCE(intensity_level, 3) INTO v_intensity FROM games WHERE id = NEW.game_id;
  IF NEW.duration_min IS NOT NULL THEN
    NEW.srpe := ROUND((v_intensity * NEW.duration_min)::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_srpe ON game_athletes;
CREATE TRIGGER trg_game_srpe
  BEFORE INSERT OR UPDATE OF duration_min ON game_athletes
  FOR EACH ROW EXECUTE FUNCTION fn_compute_game_srpe();

-- 5. Update fn_compute_individual_srpe: add recovery_bonus computation from regenerative exercises
CREATE OR REPLACE FUNCTION fn_compute_individual_srpe()
RETURNS TRIGGER AS $$
DECLARE
  v_duration   smallint;
  v_stype      session_type_enum;
  v_surface    surface_type_enum;
  v_modality   modality_type;
  v_factor     numeric := 1.0;
  v_recovery   real := 0.0;
BEGIN
  IF NEW.pse IS NULL THEN RETURN NEW; END IF;

  SELECT actual_duration_min, session_type, surface_type
    INTO v_duration, v_stype, v_surface
    FROM sessions WHERE id = NEW.session_id;

  SELECT modality INTO v_modality
    FROM athletes WHERE id = NEW.athlete_id;

  IF v_modality = 'futsal'
     AND v_surface = 'futsal_court'
     AND (v_stype = 'MD-4' OR NEW.pse >= 7) THEN
    v_factor := 1.3;
  END IF;

  IF v_duration IS NOT NULL THEN
    NEW.individual_srpe := ROUND((NEW.pse * v_duration * v_factor)::numeric, 2);

    -- Recovery bonus: (fraction of session that is regenerative) × duration × 3.0
    SELECT COALESCE(
      COUNT(*) FILTER (WHERE e.is_regenerative = true)::real
      / NULLIF(COUNT(*)::real, 0)
      * v_duration * 3.0,
      0
    ) INTO v_recovery
    FROM session_exercises se
    JOIN exercises e ON e.id = se.exercise_id
    WHERE se.session_id = NEW.session_id;

    NEW.recovery_bonus := ROUND(v_recovery::numeric, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Rebuild v_daily_load: subtract recovery_bonus; game_loads no longer requires PSE
CREATE OR REPLACE VIEW v_daily_load AS
WITH calendar AS (
  SELECT
    a.id          AS athlete_id,
    gs.date::date AS session_date
  FROM athletes a
  CROSS JOIN generate_series(
    current_date - INTERVAL '27 days',
    current_date,
    '1 day'
  ) AS gs(date)
),
session_loads AS (
  SELECT
    sa.athlete_id,
    (w.start_date + (s.day_of_week || ' days')::interval)::date AS session_date,
    COALESCE(sa.individual_srpe, 0) - COALESCE(sa.recovery_bonus, 0) AS srpe
  FROM session_athletes sa
  JOIN sessions s ON s.id = sa.session_id AND s.status = 'encerrada'
  JOIN weeks w    ON w.id = s.week_id
  WHERE sa.attended IS NOT FALSE
),
game_loads AS (
  SELECT
    ga.athlete_id,
    g.date::date AS session_date,
    COALESCE(ga.srpe, 0) AS srpe
  FROM game_athletes ga
  JOIN games g ON g.id = ga.game_id
  WHERE ga.attended IS NOT FALSE
    AND ga.srpe IS NOT NULL
),
all_loads AS (
  SELECT athlete_id, session_date, srpe FROM session_loads
  UNION ALL
  SELECT athlete_id, session_date, srpe FROM game_loads
)
SELECT
  c.athlete_id,
  c.session_date,
  COALESCE(SUM(al.srpe), 0) AS daily_srpe
FROM calendar c
LEFT JOIN all_loads al
  ON al.athlete_id = c.athlete_id
 AND al.session_date = c.session_date
GROUP BY c.athlete_id, c.session_date;
