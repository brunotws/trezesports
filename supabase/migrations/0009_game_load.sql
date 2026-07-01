-- =========================================================
-- 0009 — Game Load: PSE + sRPE tracking + v_daily_load UNION
-- Executar no Supabase SQL Editor
-- =========================================================

-- 1. Adicionar colunas a game_athletes
ALTER TABLE game_athletes
  ADD COLUMN IF NOT EXISTS attended     boolean  DEFAULT true,
  ADD COLUMN IF NOT EXISTS pse         smallint CHECK (pse BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS duration_min smallint DEFAULT 90,
  ADD COLUMN IF NOT EXISTS srpe        real;

-- 2. Trigger: calcular srpe ao registrar PSE do jogo
CREATE OR REPLACE FUNCTION fn_compute_game_srpe()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pse IS NOT NULL AND NEW.duration_min IS NOT NULL THEN
    NEW.srpe := ROUND((NEW.pse * NEW.duration_min)::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_srpe ON game_athletes;
CREATE TRIGGER trg_game_srpe
  BEFORE INSERT OR UPDATE OF pse, duration_min ON game_athletes
  FOR EACH ROW EXECUTE FUNCTION fn_compute_game_srpe();

-- 3. Atualizar v_daily_load para incluir carga de jogos
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
    COALESCE(sa.individual_srpe, 0) AS srpe
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
    AND ga.pse IS NOT NULL
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
