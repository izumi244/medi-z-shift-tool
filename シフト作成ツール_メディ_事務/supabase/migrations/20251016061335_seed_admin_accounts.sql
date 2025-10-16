-- 管理者・開発者アカウントのシードデータ

-- employeesテーブルにis_system_accountフィールドを追加
ALTER TABLE employees ADD COLUMN is_system_account BOOLEAN NOT NULL DEFAULT false;

-- employee_sequences を更新（emp001=1, emp002=2 から開始）
UPDATE employee_sequences SET last_number = 2 WHERE id = 1;

-- 管理者アカウント用従業員レコード (emp001)
INSERT INTO employees (
  name,
  employment_type,
  job_type,
  max_days_per_week,
  max_hours_per_month,
  can_work_saturday,
  employee_number,
  password_changed,
  is_system_account,
  created_at,
  updated_at
) VALUES (
  '管理者',
  'パート',
  '医療事務',
  7,
  999,
  true,
  'emp001',
  false,
  true,  -- システムアカウントとしてマーク
  NOW(),
  NOW()
);

-- 開発者アカウント用従業員レコード (emp002)
INSERT INTO employees (
  name,
  employment_type,
  job_type,
  max_days_per_week,
  max_hours_per_month,
  can_work_saturday,
  employee_number,
  password_changed,
  is_system_account,
  created_at,
  updated_at
) VALUES (
  '開発者',
  'パート', 
  '医療事務',
  7,
  999,
  true,
  'emp002',
  false,
  true,  -- システムアカウントとしてマーク
  NOW(),
  NOW()
);