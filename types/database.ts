/**
 * データベース層の型定義
 * Supabaseから取得される生データの型
 */

import type { EmploymentType, JobType } from './index'

/**
 * データベースから取得されるEmployee型（null を許容）
 */
export interface DatabaseEmployee {
  id: string
  name: string
  employment_type: EmploymentType
  job_type: JobType
  available_days: string[]
  assignable_shift_pattern_ids: string[]
  max_days_per_week: number
  max_hours_per_month: number
  max_hours_per_week?: number | null

  // 認証関連フィールド（データベース層では null を許容）
  user_id?: string | null
  employee_number?: string | null
  password_changed?: boolean | null
  is_system_account?: boolean | null

  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * DatabaseEmployee をアプリケーション層の Employee に変換
 */
export function toDomainEmployee(dbEmployee: DatabaseEmployee): import('./index').Employee {
  return {
    ...dbEmployee,
    max_hours_per_week: dbEmployee.max_hours_per_week ?? undefined,
    user_id: dbEmployee.user_id ?? undefined,
    employee_number: dbEmployee.employee_number ?? undefined,
    password_changed: dbEmployee.password_changed ?? false,
    is_system_account: dbEmployee.is_system_account ?? false,
  }
}
