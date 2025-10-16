-- employees テーブルに認証関連フィールドを追加
ALTER TABLE employees 
ADD COLUMN employee_number TEXT UNIQUE,
ADD COLUMN password_changed BOOLEAN NOT NULL DEFAULT false;

-- 従業員番号採番用テーブルを作成
CREATE TABLE employee_sequences (
  id SERIAL PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期データ: 採番テーブル
INSERT INTO employee_sequences (last_number) VALUES (0);

-- インデックス追加
CREATE INDEX idx_employees_employee_number ON employees(employee_number);
CREATE INDEX idx_employees_user_id ON employees(user_id);

-- employee_number の制約追加（NULLでない場合は一意）
ALTER TABLE employees 
ADD CONSTRAINT employees_employee_number_format 
CHECK (employee_number IS NULL OR employee_number ~ '^emp[0-9]{3}$');