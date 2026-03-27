-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  notify_monday boolean DEFAULT true,
  notify_midweek boolean DEFAULT true,
  notify_friday boolean DEFAULT true,
  notify_daily boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- QUESTIONNAIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_description text NOT NULL,
  big_goal text NOT NULL,
  current_state text NOT NULL,
  hours_per_week integer NOT NULL,
  obstacles text NOT NULL,
  content_platforms text[] NOT NULL DEFAULT '{}',
  additional_context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questionnaires_select" ON questionnaires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "questionnaires_insert" ON questionnaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "questionnaires_update" ON questionnaires FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "questionnaires_delete" ON questionnaires FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GAME PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS game_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  goal_statement text NOT NULL,
  ninety_day_target text NOT NULL,
  result_kpis jsonb NOT NULL DEFAULT '[]',
  activity_kpis jsonb NOT NULL DEFAULT '[]',
  weekly_schedule jsonb NOT NULL DEFAULT '[]',
  raw_ai_response text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_plans_select" ON game_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "game_plans_insert" ON game_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_plans_update" ON game_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "game_plans_delete" ON game_plans FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CHECK-INS
-- ============================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_plan_id uuid NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('monday_kickoff', 'midweek_pulse', 'friday_review', 'daily_nudge')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'skipped')),
  ai_message text NOT NULL,
  user_response text,
  response_data jsonb,
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "check_ins_select" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "check_ins_insert" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_update" ON check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "check_ins_delete" ON check_ins FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- KPI LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS kpi_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_plan_id uuid NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  kpi_name text NOT NULL,
  kpi_type text NOT NULL CHECK (kpi_type IN ('result', 'activity')),
  value numeric NOT NULL,
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_logs_select" ON kpi_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kpi_logs_insert" ON kpi_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kpi_logs_update" ON kpi_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kpi_logs_delete" ON kpi_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER game_plans_updated_at BEFORE UPDATE ON game_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
