-- Dynamic exercise categories (tags)

CREATE TABLE IF NOT EXISTS categories (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT 'zinc',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_categories (
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id)  ON DELETE CASCADE,
  PRIMARY KEY (category_id, exercise_id)
);
