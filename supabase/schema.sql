-- =============================================================
-- Treze Sports — Schema v2 (FM Calendar + Sports Science)
-- =============================================================

-- LIMPEZA
drop table if exists load_analytics              cascade;
drop table if exists daily_wellness              cascade;
drop table if exists game_athletes               cascade;
drop table if exists games                       cascade;
drop table if exists session_athletes            cascade;
drop table if exists session_exercises           cascade;
drop table if exists session_template_exercises  cascade;
drop table if exists session_templates           cascade;
drop table if exists sessions                    cascade;
drop table if exists weeks                       cascade;
drop table if exists exercises                   cascade;
drop table if exists athletes                    cascade;

drop function if exists fn_compute_individual_srpe cascade;

drop type if exists exercise_type      cascade;
drop type if exists session_status     cascade;
drop type if exists session_type_enum  cascade;
drop type if exists game_type          cascade;
drop type if exists position_type      cascade;
drop type if exists modality_type      cascade;
drop type if exists surface_type_enum  cascade;
drop type if exists readiness_status   cascade;

-- =============================================================
-- ENUMs
-- =============================================================
create type modality_type    as enum ('football', 'futsal');
create type surface_type_enum as enum ('grass', 'synthetic', 'futsal_court', 'gym');
create type session_type_enum as enum ('MD+1','MD+2','MD-4','MD-3','MD-2','MD-1','MD','free');
create type exercise_type    as enum ('tecnico', 'cognitivo', 'fisico', 'misto');
create type session_status   as enum ('planejada', 'em_andamento', 'encerrada');
create type game_type        as enum ('amistoso', 'campeonato');
create type position_type    as enum ('Goleiro','Defensor','Lateral','Volante','Meia','Atacante','Ala','Pivô');
create type readiness_status as enum ('green', 'yellow', 'red');

-- =============================================================
-- ATHLETES
-- =============================================================
create table athletes (
  id               uuid          primary key default gen_random_uuid(),
  name             text          not null,
  birth_date       date,
  position         position_type,
  modality         modality_type not null default 'football',
  turma            text,
  resting_hr       smallint      check (resting_hr between 30 and 120),
  attr_passe       smallint      check (attr_passe       between 0 and 100),
  attr_dominio     smallint      check (attr_dominio     between 0 and 100),
  attr_scan        smallint      check (attr_scan        between 0 and 100),
  attr_decisao     smallint      check (attr_decisao     between 0 and 100),
  attr_mobilidade  smallint      check (attr_mobilidade  between 0 and 100),
  attr_finalizacao smallint      check (attr_finalizacao between 0 and 100),
  created_at       timestamptz   default now()
);

-- =============================================================
-- DAILY WELLNESS  (pré-treino · 5 = melhor · 1 = pior)
-- =============================================================
create table daily_wellness (
  id            uuid        primary key default gen_random_uuid(),
  athlete_id    uuid        not null references athletes(id) on delete cascade,
  date          date        not null,
  fatigue       smallint    not null check (fatigue       between 1 and 5),
  sleep_quality smallint    not null check (sleep_quality between 1 and 5),
  doms          smallint    not null check (doms          between 1 and 5),
  mood          smallint    not null check (mood          between 1 and 5),
  resting_hr    smallint    check (resting_hr between 30 and 120),
  wellness_total smallint   generated always as (fatigue + sleep_quality + doms + mood) stored,
  created_at    timestamptz default now(),
  unique (athlete_id, date)
);

-- =============================================================
-- EXERCISES
-- =============================================================
create table exercises (
  id                         uuid          primary key default gen_random_uuid(),
  name                       text          not null,
  description                text,
  attribute_target           text,
  type                       exercise_type not null,
  fatigue_level              smallint      not null check (fatigue_level between 1 and 5),
  is_eccentric               boolean       not null default false,
  -- Se doms do atleta ≤ este valor, substituir pelo substitute_exercise_id
  contraindicated_doms_below smallint      check (contraindicated_doms_below between 1 and 5),
  substitute_exercise_id     uuid          references exercises(id),
  created_at                 timestamptz   default now()
);

-- =============================================================
-- SESSION TEMPLATES
-- =============================================================
create table session_templates (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  created_at  timestamptz default now()
);

create table session_template_exercises (
  id          uuid     primary key default gen_random_uuid(),
  template_id uuid     references session_templates(id) on delete cascade,
  exercise_id uuid     references exercises(id)         on delete restrict,
  position    smallint not null default 0
);

-- =============================================================
-- WEEKS  (start_date = sempre segunda-feira)
-- =============================================================
create table weeks (
  id         uuid        primary key default gen_random_uuid(),
  start_date date        not null unique,
  created_at timestamptz default now()
);

-- =============================================================
-- SESSIONS  (cada célula da grade FM: 7 dias × 3 sessões)
-- day_of_week: 0 = Seg, 1 = Ter ... 6 = Dom
-- session_number: 1 | 2 | 3  (manhã | tarde | noite)
-- =============================================================
create table sessions (
  id                  uuid               primary key default gen_random_uuid(),
  week_id             uuid               references weeks(id) on delete cascade,
  day_of_week         smallint           not null check (day_of_week between 0 and 6),
  session_number      smallint           not null check (session_number between 1 and 3),
  session_type        session_type_enum  not null default 'free',
  surface_type        surface_type_enum,
  status              session_status     not null default 'planejada',
  blocked             boolean            not null default false,
  blocked_reason      text,
  -- Preenchido ao encerrar a sessão
  actual_rpe          smallint           check (actual_rpe between 0 and 10),
  actual_duration_min smallint           check (actual_duration_min between 1 and 300),
  created_at          timestamptz        default now(),
  unique (week_id, day_of_week, session_number)
);

-- =============================================================
-- SESSION EXERCISES  (sequência DnD por sessão)
-- =============================================================
create table session_exercises (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        references sessions(id)  on delete cascade,
  exercise_id uuid        references exercises(id) on delete restrict,
  position    smallint    not null default 0,
  created_at  timestamptz default now()
);

-- =============================================================
-- SESSION ATHLETES  (presença + PSE individual pós-treino)
-- =============================================================
create table session_athletes (
  id              uuid        primary key default gen_random_uuid(),
  session_id      uuid        references sessions(id) on delete cascade,
  athlete_id      uuid        references athletes(id) on delete cascade,
  attended        boolean     default null,
  pse             smallint    check (pse between 0 and 10),
  -- individual_srpe = PSE × actual_duration_min × fator_superfície
  individual_srpe numeric(8,2),
  created_at      timestamptz default now(),
  unique (session_id, athlete_id)
);

-- =============================================================
-- TRIGGER — individual_srpe
-- Aplica fator 1.3 para futsal em piso rígido (futsal_court)
-- quando sessão é alta intensidade (MD-4 ou PSE ≥ 7)
-- =============================================================
create or replace function fn_compute_individual_srpe()
returns trigger as $$
declare
  v_duration   smallint;
  v_stype      session_type_enum;
  v_surface    surface_type_enum;
  v_modality   modality_type;
  v_factor     numeric := 1.0;
begin
  select actual_duration_min, session_type, surface_type
    into v_duration, v_stype, v_surface
    from sessions where id = new.session_id;

  select modality into v_modality
    from athletes where id = new.athlete_id;

  if v_modality = 'futsal'
     and v_surface = 'futsal_court'
     and (v_stype = 'MD-4' or new.pse >= 7) then
    v_factor := 1.3;
  end if;

  if v_duration is not null then
    new.individual_srpe := round((new.pse * v_duration * v_factor)::numeric, 2);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_individual_srpe
before insert or update of pse on session_athletes
for each row when (new.pse is not null)
execute function fn_compute_individual_srpe();

-- =============================================================
-- GAMES
-- =============================================================
create table games (
  id                uuid        primary key default gen_random_uuid(),
  date              date        not null,
  opponent          text        not null,
  type              game_type   not null,
  blocks_day_before boolean     not null default false,
  created_at        timestamptz default now()
);

create table game_athletes (
  game_id    uuid references games(id)    on delete cascade,
  athlete_id uuid references athletes(id) on delete cascade,
  primary key (game_id, athlete_id)
);

-- =============================================================
-- LOAD ANALYTICS  (cache · recalculado ao encerrar sessão)
-- =============================================================
create table load_analytics (
  id                       uuid             primary key default gen_random_uuid(),
  athlete_id               uuid             not null references athletes(id) on delete cascade,
  date                     date             not null,
  acute_load               numeric(8,2),
  chronic_load             numeric(8,2),
  acwr                     numeric(5,3),
  weekly_monotony          numeric(5,3),
  weekly_strain            numeric(10,2),
  readiness_status         readiness_status,
  volume_adjustment_factor numeric(3,2),
  calculated_at            timestamptz      default now(),
  unique (athlete_id, date)
);

-- =============================================================
-- ÍNDICES
-- =============================================================
create index on sessions               (week_id);
create index on session_exercises      (session_id);
create index on session_athletes       (session_id);
create index on session_athletes       (athlete_id);
create index on daily_wellness         (athlete_id, date desc);
create index on load_analytics         (athlete_id, date desc);
create index on game_athletes          (athlete_id);

-- =============================================================
-- VIEWS
-- =============================================================

-- Carga planejada por sessão (Σ fatigue_level dos exercícios)
create or replace view session_planned_load as
select
  s.id as session_id,
  coalesce(sum(e.fatigue_level), 0) as planned_load
from sessions s
left join session_exercises se on se.session_id = s.id
left join exercises e          on e.id = se.exercise_id
group by s.id;

-- Carga diária real por atleta (zero-filled — base do ACWR)
-- Inclui dias sem treino com srpe = 0
create or replace view v_daily_load as
with calendar as (
  select
    a.id             as athlete_id,
    gs.date::date    as session_date
  from athletes a
  cross join generate_series(
    current_date - interval '27 days',
    current_date,
    '1 day'
  ) as gs(date)
),
session_dates as (
  select
    sa.athlete_id,
    (w.start_date + (s.day_of_week || ' days')::interval)::date as session_date,
    coalesce(sa.individual_srpe, 0) as srpe
  from session_athletes sa
  join sessions s on s.id = sa.session_id and s.status = 'encerrada'
  join weeks w    on w.id = s.week_id
  where sa.attended is not false
)
select
  c.athlete_id,
  c.session_date,
  coalesce(sum(sd.srpe), 0) as daily_srpe
from calendar c
left join session_dates sd
  on sd.athlete_id = c.athlete_id
 and sd.session_date = c.session_date
group by c.athlete_id, c.session_date;

-- ACWR por atleta (aguda 7d / crônica 28d)
create or replace view v_acwr as
select
  athlete_id,
  round(avg(daily_srpe) filter (
    where session_date >= current_date - interval '6 days'
  )::numeric, 2) as acute_load,
  round(avg(daily_srpe)::numeric, 2) as chronic_load,
  case
    when avg(daily_srpe) = 0 then null
    else round((
      avg(daily_srpe) filter (where session_date >= current_date - interval '6 days')
      / nullif(avg(daily_srpe), 0)
    )::numeric, 3)
  end as acwr
from v_daily_load
group by athlete_id;

-- Monotonia e Strain semanais
create or replace view v_weekly_stats as
with week_data as (
  select athlete_id, daily_srpe
  from v_daily_load
  where session_date >= current_date - interval '6 days'
)
select
  athlete_id,
  round(sum(daily_srpe)::numeric, 2)        as weekly_total_load,
  round(avg(daily_srpe)::numeric, 2)        as weekly_avg_load,
  round(stddev_pop(daily_srpe)::numeric, 2) as weekly_std_dev,
  case
    when stddev_pop(daily_srpe) = 0 and avg(daily_srpe) > 0 then 10.0
    when avg(daily_srpe) = 0 then 0.0
    else round((avg(daily_srpe) / nullif(stddev_pop(daily_srpe), 0))::numeric, 3)
  end as monotony,
  case
    when stddev_pop(daily_srpe) = 0 and avg(daily_srpe) > 0
      then round((sum(daily_srpe) * 10.0)::numeric, 2)
    when avg(daily_srpe) = 0 then 0.0
    else round((
      sum(daily_srpe) * (avg(daily_srpe) / nullif(stddev_pop(daily_srpe), 0))
    )::numeric, 2)
  end as strain
from week_data
group by athlete_id;

-- Compatibilidade: cansaço acumulado por carga planejada (Sprint 1)
create or replace view athlete_week_fatigue as
select
  sa.athlete_id,
  s.week_id,
  sum(spl.planned_load) as accumulated_fatigue
from session_athletes sa
join sessions s               on s.id = sa.session_id
join session_planned_load spl on spl.session_id = sa.session_id
where s.status = 'encerrada'
  and sa.attended is not false
group by sa.athlete_id, s.week_id;

-- =============================================================
-- RLS (MVP: anon total)
-- =============================================================
alter table athletes                   enable row level security;
alter table daily_wellness             enable row level security;
alter table exercises                  enable row level security;
alter table session_templates          enable row level security;
alter table session_template_exercises enable row level security;
alter table weeks                      enable row level security;
alter table sessions                   enable row level security;
alter table session_exercises          enable row level security;
alter table session_athletes           enable row level security;
alter table games                      enable row level security;
alter table game_athletes              enable row level security;
alter table load_analytics             enable row level security;

create policy "anon_all" on athletes                   for all to anon using (true) with check (true);
create policy "anon_all" on daily_wellness             for all to anon using (true) with check (true);
create policy "anon_all" on exercises                  for all to anon using (true) with check (true);
create policy "anon_all" on session_templates          for all to anon using (true) with check (true);
create policy "anon_all" on session_template_exercises for all to anon using (true) with check (true);
create policy "anon_all" on weeks                      for all to anon using (true) with check (true);
create policy "anon_all" on sessions                   for all to anon using (true) with check (true);
create policy "anon_all" on session_exercises          for all to anon using (true) with check (true);
create policy "anon_all" on session_athletes           for all to anon using (true) with check (true);
create policy "anon_all" on games                      for all to anon using (true) with check (true);
create policy "anon_all" on game_athletes              for all to anon using (true) with check (true);
create policy "anon_all" on load_analytics             for all to anon using (true) with check (true);

-- =============================================================
-- SEED — Exercícios Base
-- =============================================================
insert into exercises (name, attribute_target, type, fatigue_level, is_eccentric, contraindicated_doms_below) values
  ('Aquecimento com bola',      null,           'tecnico',  1, false, null),
  ('Controle Orientado',        'dominio',      'misto',    2, false, null),
  ('Circuito com Decisão',      'decisao',      'cognitivo',3, false, null),
  ('Estímulo Visual Cones',     'scan',         'tecnico',  2, false, null),
  ('Jogo Reduzido 2x1',         'decisao',      'cognitivo',3, false, null),
  ('Passe em Movimento',        'passe',        'tecnico',  2, false, null),
  ('Deslocamento Lateral',      'mobilidade',   'tecnico',  2, false, null),
  ('Finalização ao Gol',        'finalizacao',  'misto',    3, false, null),
  ('Pressão com Tempo',         'scan',         'cognitivo',4, false, null),
  ('Recuperação Ativa',         null,           'tecnico',  1, false, null),
  ('Nordic Hamstring Curl',     null,           'fisico',   4, true,  3),
  ('Agachamento Unilateral',    null,           'fisico',   4, true,  3),
  ('Sprint Interval 6×30m',     'mobilidade',   'fisico',   5, false, null),
  ('Copenhagen Plank',          null,           'fisico',   3, false, null),
  ('Foam Rolling + Mobilidade', null,           'tecnico',  1, false, null),
  ('Isometria Isquiotibiais',   null,           'fisico',   2, false, null),
  ('Wall Sit (Isometria Quad)', null,           'fisico',   2, false, null);
