-- Supabase Authから独自認証システムに移行

-- pgcrypto拡張を有効化（bcryptハッシュ用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- user_idフィールドを削除（Supabase Auth関連）
ALTER TABLE employees DROP COLUMN IF EXISTS user_id;

-- 独自認証フィールドを追加
ALTER TABLE employees 
ADD COLUMN password_hash TEXT,
ADD COLUMN session_token TEXT,
ADD COLUMN last_login TIMESTAMPTZ;

-- 開発者・管理者の従業員番号を正しく割り当て
-- 一時的にemp999を使用して競合を避ける
UPDATE employees SET employee_number = 'emp999' WHERE name = '開発者';
UPDATE employees SET employee_number = 'emp002' WHERE name = '管理者';
UPDATE employees SET employee_number = 'emp001' WHERE name = '開発者';

-- 開発者・管理者の初期パスワードを設定
-- 開発者: emp001 / dev123
UPDATE employees 
SET password_hash = crypt('dev123', gen_salt('bf'))
WHERE employee_number = 'emp001';

-- 管理者: emp002 / admin123  
UPDATE employees 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE employee_number = 'emp002';

-- employee_sequencesの番号も更新
UPDATE employee_sequences SET last_number = 2 WHERE id = 1;

-- セッション管理用のインデックス追加
CREATE INDEX IF NOT EXISTS idx_employees_session_token ON employees(session_token);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number_hash ON employees(employee_number) WHERE employee_number IS NOT NULL;