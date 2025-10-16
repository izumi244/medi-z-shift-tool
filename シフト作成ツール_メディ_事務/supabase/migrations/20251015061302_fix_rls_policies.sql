-- 既存のポリシーを削除
DROP POLICY IF EXISTS "全員が従業員情報を閲覧可能" ON employees;
DROP POLICY IF EXISTS "管理者のみ従業員を編集可能" ON employees;
DROP POLICY IF EXISTS "全員がシフトパターンを閲覧可能" ON shift_patterns;
DROP POLICY IF EXISTS "管理者のみシフトパターンを編集可能" ON shift_patterns;
DROP POLICY IF EXISTS "全員がシフトを閲覧可能" ON shifts;
DROP POLICY IF EXISTS "管理者のみシフトを編集可能" ON shifts;
DROP POLICY IF EXISTS "希望休の作成" ON leave_requests;
DROP POLICY IF EXISTS "希望休の閲覧" ON leave_requests;
DROP POLICY IF EXISTS "管理者のみ希望休を更新可能" ON leave_requests;
DROP POLICY IF EXISTS "管理者のみ制約を編集可能" ON constraints;

-- 新しいポリシー: 匿名ユーザーも含めて全員が閲覧可能
CREATE POLICY "全員が従業員情報を閲覧可能" ON employees
  FOR SELECT
  USING (true);

CREATE POLICY "全員がシフトパターンを閲覧可能" ON shift_patterns
  FOR SELECT
  USING (true);

CREATE POLICY "全員がシフトを閲覧可能" ON shifts
  FOR SELECT
  USING (true);

CREATE POLICY "全員が希望休を閲覧可能" ON leave_requests
  FOR SELECT
  USING (true);

CREATE POLICY "全員が制約を閲覧可能" ON constraints
  FOR SELECT
  USING (true);

-- 書き込みは匿名ユーザーでも可能に（開発環境用）
CREATE POLICY "全員が従業員を追加可能" ON employees
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "全員が従業員を更新可能" ON employees
  FOR UPDATE
  USING (true);

CREATE POLICY "全員が従業員を削除可能" ON employees
  FOR DELETE
  USING (true);

CREATE POLICY "全員がシフトパターンを追加可能" ON shift_patterns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "全員がシフトパターンを更新可能" ON shift_patterns
  FOR UPDATE
  USING (true);

CREATE POLICY "全員がシフトパターンを削除可能" ON shift_patterns
  FOR DELETE
  USING (true);

CREATE POLICY "全員がシフトを追加可能" ON shifts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "全員がシフトを更新可能" ON shifts
  FOR UPDATE
  USING (true);

CREATE POLICY "全員がシフトを削除可能" ON shifts
  FOR DELETE
  USING (true);

CREATE POLICY "全員が希望休を追加可能" ON leave_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "全員が希望休を更新可能" ON leave_requests
  FOR UPDATE
  USING (true);

CREATE POLICY "全員が希望休を削除可能" ON leave_requests
  FOR DELETE
  USING (true);

CREATE POLICY "全員が制約を追加可能" ON constraints
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "全員が制約を更新可能" ON constraints
  FOR UPDATE
  USING (true);

CREATE POLICY "全員が制約を削除可能" ON constraints
  FOR DELETE
  USING (true);