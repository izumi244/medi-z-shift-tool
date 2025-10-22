// types/index.ts - 認証システム対応版

import { ReactNode } from 'react'

// ==================== 基本型定義 ====================

export type PageType = 'dataInput' | 'employee' | 'leave' | 'constraints' | 'shift' | 'shiftPattern'

export type EmploymentType = '常勤' | 'パート'
export type JobType = '医療事務'

// 記号システム（6種類に拡張）
export type ShiftSymbol = '○' | '▲' | '◆' | '×' | '✕' | '■' | '▶'

// 固定5パターンに変更
export type ShiftPatternType = 'fulltime_weekday' | 'saturday' | 'morning_short' | 'afternoon_short' | 'kirayama_weekday'

export type LeaveType = '希望休' | '有給' | '忌引' | '病欠' | 'その他' | '出勤可能'
export type RequestStatus = '申請中' | '承認' | '却下'

// ==================== データ型定義 ====================

// シフトパターン（5固定パターン）
export interface ShiftPattern {
  id: string
  name: string
  symbol: ShiftSymbol
  startTime: string          // キャメルケースに統一
  endTime: string            // キャメルケースに統一
  workingHours: number       // 実労働時間
  breakMinutes?: number      // 休憩時間（分）
  color?: string             // 表示用カラー
}

// 従業員（認証対応版）
export interface Employee {
  id: string
  name: string
  employment_type: EmploymentType
  job_type: JobType
  available_days: string[]  // 勤務可能曜日
  assignable_shift_pattern_ids: string[]  // 対応可能シフトパターン
  
  // 新要件：労働時間制約
  max_days_per_week: number     // 週最大勤務日数
  max_hours_per_month: number   // 月最大労働時間（16日-15日）
  max_hours_per_week?: number   // 週最大労働時間（富沢の26時間制限）

  // 認証関連フィールド（アプリケーション層では常にデフォルト値を持つ）
  user_id?: string
  employee_number?: string
  password_changed: boolean  // デフォルト: false
  is_system_account: boolean  // デフォルト: false

  is_active: boolean
  created_at: string
  updated_at: string
}

// シフト（記号ベースに変更）
export interface Shift {
  id: string
  employee_id: string
  date: string
  symbol: ShiftSymbol          // 記号表示
  shift_pattern_id?: string    // 使用したシフトパターン
  actual_start_time?: string   // 実際の開始時間
  actual_end_time?: string     // 実際の終了時間
  actual_hours: number         // 実労働時間
  status: 'draft' | 'confirmed' | 'modified'
  created_at: string
  updated_at: string
}

// 希望休（変更なし）
export interface LeaveRequest {
  id: string
  employee_id: string
  date: string
  leave_type: LeaveType
  reason?: string
  status: RequestStatus
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

// AI制約ガイドライン（簡略化）
export interface AIConstraintGuideline {
  id: string
  constraint_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 制約条件（Constraint型を追加）
export interface Constraint {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 従業員番号採番テーブル（新規追加）
export interface EmployeeSequence {
  id: number
  last_number: number
  created_at: string
  updated_at: string
}

// ==================== UI型定義 ====================

// アプリケーション状態
export interface AppState {
  current_page: PageType
  current_user: {
    id: string
    name: string
    role: 'admin' | 'staff'
    permissions: string[]
  }
  loading: boolean
  error?: string
}

// 通知
export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  auto_hide: boolean
}

// ==================== フォーム型定義 ====================

// 従業員フォーム（制約フィールド追加）
export interface EmployeeFormData {
  name: string
  employment_type: EmploymentType
  job_type: JobType
  available_days: string[]
  assignable_shift_pattern_ids: string[]
  max_days_per_week: number
  max_hours_per_month: number
  max_hours_per_week?: number
}

// 希望休フォーム（変更なし）
export interface LeaveFormData {
  employee_id: string
  date: string
  leave_type: LeaveType
  reason?: string
}

// AI制約フォーム（簡略化）
export interface ConstraintFormData {
  constraint_content: string
}

// ==================== API型定義 ====================

// APIエラー
export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

// APIレスポンス
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
}

// バリデーションエラー
export interface ValidationError {
  field: string
  message: string
  code: string
}

// ==================== プロップス型定義 ====================

// レイアウトコンポーネント
export interface LayoutProps {
  children: ReactNode
}

// ページコンポーネント
export interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

// ==================== モック用型定義 ====================

// 統計データ
export interface Statistics {
  employee_count: number
  leave_requests_count: number
  shift_pattern_count: number
  constraint_rules_count: number
  monthly_hours: Record<string, number>
  violations: string[]
}

// 最近の活動
export interface RecentActivity {
  id: string
  type: 'leave_request' | 'shift_confirmed' | 'rule_added'
  message: string
  timestamp: string
  user?: string
}

// ==================== ユーティリティ型 ====================

// 日付範囲
export interface DateRange {
  start: string
  end: string
}

// 検索フィルター
export interface SearchFilters {
  text?: string
  employment_type?: EmploymentType[]
  job_type?: JobType[]
  date_range?: DateRange
  active_only?: boolean
}

// ソート設定
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// ページネーション
export interface PaginationConfig {
  page: number
  limit: number
  total?: number
}

// ==================== 認証関連型定義 ====================

export type UserRole = 'admin' | 'employee' | 'developer'

// 修正版User型 - employee_numberプロパティを追加
export interface User {
  id: string
  user_id: string
  employee_number: string    // 追加: 従業員番号
  name: string
  role: UserRole
  avatar?: string
  created_at: string
  last_login?: string
}

export interface LoginCredentials {
  user_id: string
  password: string
  remember_me: boolean
}

// 認証状態
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

// 従業員登録時のアカウント情報
export interface EmployeeAccountInfo {
  employee_id: string
  employee_number: string
  initial_password: string
  created_at: string
}

// パスワード変更フォーム
export interface PasswordChangeForm {
  current_password: string
  new_password: string
  confirm_password: string
}

// ==================== 新要件専用型定義 ====================

// 月間労働時間管理（16日-15日サイクル）
export interface MonthlyWorkHours {
  employee_id: string
  period_start: string  // 16日
  period_end: string    // 翌月15日
  total_hours: number
  total_days: number
  weekly_breakdown: {
    week_start: string
    hours: number
    days: number
  }[]
}

// シフト作成制約
export interface ShiftConstraints {
  employee_id: string
  max_consecutive_days: number
  required_rest_days: number
  preferred_patterns: string[]
}

// 記号表示用のセルデータ
export interface ShiftCellData {
  date: string
  employee_id: string
  symbol: ShiftSymbol | null
  pattern_id?: string
  hours: number
  is_editable: boolean
}