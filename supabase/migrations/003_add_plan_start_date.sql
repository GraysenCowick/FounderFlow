-- Add plan start date to anchor the 90-day schedule to a real calendar date
ALTER TABLE game_plans ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE;
