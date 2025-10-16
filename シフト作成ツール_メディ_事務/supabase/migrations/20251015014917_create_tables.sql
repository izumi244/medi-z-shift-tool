-- 従業員情報テーブル
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  job_type TEXT NOT NULL,
  max_hours_per_month INTEGER NOT NULL,
  max_days_per_week INTEGER NOT NULL,
  can_work_saturday BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- シフトパターンテーブル
CREATE TABLE shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  work_minutes INTEGER NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- シフト実績テーブル
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_symbol TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 希望休申請テーブル
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leave_type TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT '申請中',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 制約条件テーブル
CREATE TABLE constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_leave_requests_date ON leave_requests(date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- RLS（Row Level Security）有効化
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 全員が閲覧可能（認証済みユーザー）
CREATE POLICY "全員が従業員情報を閲覧可能" ON employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "全員がシフトパターンを閲覧可能" ON shift_patterns
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "全員がシフトを閲覧可能" ON shifts
  FOR SELECT TO authenticated
  USING (true);

-- 管理者のみ編集可能（role='admin'のユーザー）
CREATE POLICY "管理者のみ従業員を編集可能" ON employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "管理者のみシフトパターンを編集可能" ON shift_patterns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "管理者のみシフトを編集可能" ON shifts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "管理者のみ制約を編集可能" ON constraints
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 希望休: 自分のデータを作成・閲覧可能
CREATE POLICY "希望休の作成" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "希望休の閲覧" ON leave_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_id
      AND employees.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 管理者のみ希望休を承認/却下可能
CREATE POLICY "管理者のみ希望休を更新可能" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 初期データ: シフトパターン
INSERT INTO shift_patterns (symbol, name, start_time, end_time, work_minutes, break_minutes) VALUES
  ('○', '通常勤務', '09:00', '17:00', 480, 60),
  ('▲', '短時間', '09:00', '13:00', 240, 0),
  ('◆', '遅番', '13:00', '19:00', 360, 60),
  ('×', '休み', '', '', 0, 0),
  ('', '未定', '', '', 0, 0);