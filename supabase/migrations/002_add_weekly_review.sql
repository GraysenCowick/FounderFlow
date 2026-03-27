-- Add weekly_review to the check_ins type constraint
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_type_check;
ALTER TABLE check_ins ADD CONSTRAINT check_ins_type_check
  CHECK (type IN ('monday_kickoff', 'midweek_pulse', 'friday_review', 'daily_nudge', 'weekly_review'));
