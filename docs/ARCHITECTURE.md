# アーキテクチャ設計ドキュメント

## プロジェクト構成

```
事務シフト/
├── app/                    # Next.js App Router
│   └── api/               # API Routes
├── components/            # React コンポーネント
├── contexts/              # React Context (状態管理)
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ・ライブラリ
├── types/                 # TypeScript 型定義
├── utils/                 # 汎用ユーティリティ
└── docs/                  # ドキュメント
```

## レイヤー構造

### 1. プレゼンテーション層
- **ディレクトリ**: `components/`, `app/`
- **責務**: ユーザーインターフェース、ユーザーインタラクション
- **技術**: React, Next.js, Tailwind CSS

### 2. アプリケーション層
- **ディレクトリ**: `contexts/`, `hooks/`
- **責務**: ビジネスロジック、状態管理
- **技術**: React Context, Custom Hooks

### 3. ドメイン層
- **ディレクトリ**: `lib/`, `utils/`
- **責務**: コアロジック、バリデーション、ユーティリティ
- **技術**: TypeScript

### 4. データ層
- **ディレクトリ**: `types/database.ts`, `lib/supabase.ts`
- **責務**: データベースアクセス、データ変換
- **技術**: Supabase, PostgreSQL

## データフロー

```
[UI Component]
    ↓ ユーザー操作
[Context (状態管理)]
    ↓ ビジネスロジック
[Utility/Lib (ドメインロジック)]
    ↓ データ取得・変換
[Supabase Client]
    ↓ クエリ
[PostgreSQL Database]
```

## 主要な設計判断

### 1. 命名規則: snake_case の採用

**判断**: データベース層とアプリケーション層の両方で `snake_case` を使用

**理由**:
- Supabaseとの整合性を保つ
- 手動マッピングの削減
- 既存機能への影響を避ける

**詳細**: [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md) を参照

### 2. 型の分離

**判断**: データベース層とアプリケーション層で型を分離

**実装**:
```typescript
// データベース層（null許容）
type DatabaseEmployee = {
  password_changed?: boolean | null
}

// アプリケーション層（デフォルト値保証）
type Employee = {
  password_changed: boolean  // 常に false または true
}
```

**理由**:
- データベースとアプリケーションの責任を明確化
- 型安全性の向上
- nullチェックの削減

### 3. エラーハンドリングの統一

**判断**: `logError()` 関数で統一

**実装**:
```typescript
// lib/errorHandler.ts
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error)
}
```

**理由**:
- エラーログの形式を統一
- 将来的なエラートラッキングサービスとの統合を容易に

### 4. 認証フロー

**判断**: カスタム認証システム（bcrypt + localStorage）

**理由**:
- Supabase Authではなく、独自のemployee_numberベース認証
- セッション管理を柔軟に制御
- 従業員番号の自動採番に対応

**フロー**:
```
Login → bcrypt検証 → sessionToken生成 → localStorage保存
```

## セキュリティ考慮事項

### 1. パスワード管理
- bcryptでハッシュ化（saltRounds: 10）
- 初回ログイン時にパスワード変更を強制

### 2. セッション管理
- localStorage にセッショントークンを保存
- 有効期限チェック（8時間 or 14日間）

### 3. 環境変数
- 機密情報は `.env.local` に格納
- `.gitignore` で管理

## パフォーマンス最適化

### 1. useMemo の活用
```typescript
const filteredEmployees = useNonSystemEmployees(employees)
```

### 2. データ変換の最適化
```typescript
const employeeData = data.map(toDomainEmployee)  // 変換関数で一元化
```

### 3. 不要な再レンダリングの防止
- React Context の適切な分割
- useCallback の活用

## 今後の改善案

### 短期（1-2週間）
- [ ] エラー境界（Error Boundary）の追加
- [ ] ローディング状態の統一
- [ ] トースト通知の実装

### 中期（1-2ヶ月）
- [ ] ユニットテストの追加
- [ ] E2Eテストの実装
- [ ] パフォーマンスモニタリング

### 長期（3ヶ月以上）
- [ ] マイクロフロントエンド化の検討
- [ ] GraphQLへの移行検討
- [ ] PWA対応

## 関連ドキュメント

- [命名規則ガイドライン](./NAMING_CONVENTIONS.md)
- [環境変数設定](./ENVIRONMENT.md) ※未作成
- [デプロイガイド](./DEPLOYMENT.md) ※未作成

## 変更履歴

- 2025-10-22: 初版作成
