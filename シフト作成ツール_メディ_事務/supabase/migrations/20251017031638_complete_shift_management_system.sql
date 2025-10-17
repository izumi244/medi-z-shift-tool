-- シフト管理システム完全版マイグレーション（独自認証システム）

-- 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== 全テーブル作成 ====================

-- 従業員情報テーブル（独自認証システム統合）
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  job_type TEXT NOT NULL,
  max_hours_per_month INTEGER NOT NULL,
  max_days_per_week INTEGER NOT NULL,
  can_work_saturday BOOLEAN NOT NULL DEFAULT true,
  
  -- 認証関連フィールド
  employee_number TEXT UNIQUE,
  password_hash TEXT,
  session_token TEXT,
  last_login TIMESTAMPTZ,
  password_changed BOOLEAN NOT NULL DEFAULT false,
  is_system_account BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 従業員番号採番用テーブル
CREATE TABLE employee_sequences (
  id SERIAL PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
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
  approved_by TEXT,
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

-- ==================== インデックス・制約 ====================

-- インデックス作成
CREATE INDEX idx_employees_employee_number ON employees(employee_number);
CREATE INDEX idx_employees_session_token ON employees(session_token);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_leave_requests_date ON leave_requests(date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- 制約条件
ALTER TABLE employees 
ADD CONSTRAINT employees_employee_number_format 
CHECK (employee_number IS NULL OR employee_number ~ '^emp[0-9]{3}$');

-- ==================== RLS設定 ====================

-- RLS有効化
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;

-- 開発環境用ポリシー（全操作許可）
CREATE POLICY "開発環境_employees" ON employees FOR ALL USING (true);
CREATE POLICY "開発環境_shifts" ON shifts FOR ALL USING (true);
CREATE POLICY "開発環境_leave_requests" ON leave_requests FOR ALL USING (true);
CREATE POLICY "開発環境_constraints" ON constraints FOR ALL USING (true);
CREATE POLICY "開発環境_shift_patterns" ON shift_patterns FOR ALL USING (true);

-- ==================== 初期データ ====================

-- 従業員番号採番テーブル初期化
INSERT INTO employee_sequences (last_number) VALUES (2);

-- システムアカウント作成（一時的にプレーンテキスト）
INSERT INTO employees (
  name, employment_type, job_type, max_days_per_week, max_hours_per_month,
  can_work_saturday, employee_number, password_hash, password_changed, is_system_account
) VALUES 
(
  '開発者', 'パート', '医療事務', 7, 999, true,
  'emp001', 'TEMP_dev123', false, true
),
(
  '管理者', 'パート', '医療事務', 7, 999, true,
  'emp002', 'TEMP_admin123', false, true
);

-- シフトパターン初期データ
INSERT INTO shift_patterns (symbol, name, start_time, end_time, work_minutes, break_minutes) VALUES
  ('○', '通常勤務', '09:00', '17:00', 480, 60),
  ('▲', '短時間', '09:00', '13:00', 240, 0),
  ('◆', '遅番', '13:00', '19:00', 360, 60),
  ('×', '休み', '', '', 0, 0),
  ('■', '未定', '', '', 0, 0);