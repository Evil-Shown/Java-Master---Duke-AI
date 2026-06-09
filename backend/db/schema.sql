-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN,
  score INT,
  updated TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
