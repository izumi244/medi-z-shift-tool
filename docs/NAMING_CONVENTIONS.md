# 命名規則ガイドライン

## 概要

このプロジェクトでは、データベース層とアプリケーション層の一貫性を保つため、**snake_case を統一的に使用** しています。

## 設計判断の理由

### なぜ snake_case を採用したか

1. **データベースとの整合性**
   - Supabase（PostgreSQL）は `snake_case` を標準とする
   - データベースのカラム名とTypeScriptの型を一致させることで、変換コストを削減

2. **保守性の向上**
   - 手動マッピングのエラーを防止
   - データベーススキーマ変更時の影響範囲を最小化

3. **Next.js/React での許容性**
   - Next.js や React では `snake_case` も一般的に使用される
   - TypeScript の型安全性により、命名規則よりも型の正確性が重要

## 命名規則の詳細

### データベース層（Supabase）

```typescript
// テーブル名: snake_case（複数形）
employees
shift_patterns
leave_requests

// カラム名: snake_case
employee_number
password_changed
is_system_account
created_at
updated_at
```

### アプリケーション層（TypeScript/React）

```typescript
// 型定義: PascalCase
interface Employee {
  // フィールド: snake_case（データベースと一致）
  employee_number?: string
  password_changed: boolean
  is_system_account: boolean
}

// コンポーネント名: PascalCase
export default function EmployeePage() { ... }

// 関数名: camelCase
const fetchEmployees = async () => { ... }
const addEmployee = async () => { ... }

// 変数名: camelCase
const [isLoading, setIsLoading] = useState(false)
const employeeData = useShiftData()
```

### 例外: camelCase を使用する場合

以下の場合のみ `camelCase` を使用：

1. **React のライフサイクル・フック**
   ```typescript
   useEffect(() => { ... })
   useState()
   useMemo()
   ```

2. **イベントハンドラー**
   ```typescript
   const handleClick = () => { ... }
   const handleSubmit = () => { ... }
   ```

3. **ローカル変数（データベースに関連しない）**
   ```typescript
   const currentDate = new Date()
   const filteredEmployees = employees.filter(...)
   ```

## 変換が必要な場合

将来的に camelCase への統一が必要になった場合は、以下の手順で実施：

1. **マッピング層の作成**
   ```typescript
   // types/mappers/employeeMapper.ts
   export function toAppEmployee(dbEmployee: DatabaseEmployee): Employee {
     return {
       id: dbEmployee.id,
       employeeNumber: dbEmployee.employee_number,
       passwordChanged: dbEmployee.password_changed,
       // ...
     }
   }
   ```

2. **段階的な移行**
   - まず新規コードから適用
   - 既存コードは徐々に移行

3. **テストの追加**
   - 変換ロジックのユニットテスト
   - E2Eテストで動作確認

## 参考資料

- [Supabase Naming Conventions](https://supabase.com/docs/guides/database/tables#naming-conventions)
- [TypeScript Coding Guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

## 変更履歴

- 2025-10-22: 初版作成 - snake_case を標準として採用
