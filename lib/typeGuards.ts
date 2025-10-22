/**
 * 型ガード関数
 * TypeScriptの型安全性を高めるためのユーティリティ
 */

import type { Employee } from '@/types'

/**
 * Employeeオブジェクトが有効かチェック
 */
export function isValidEmployee(emp: any): emp is Employee {
  return (
    emp &&
    typeof emp.id === 'string' &&
    typeof emp.name === 'string' &&
    typeof emp.is_system_account === 'boolean' &&
    typeof emp.password_changed === 'boolean'
  )
}

/**
 * システムアカウントかどうかをチェック
 */
export function isSystemAccount(emp: Employee): boolean {
  return emp.is_system_account === true
}

/**
 * パスワード変更済みかどうかをチェック
 */
export function hasChangedPassword(emp: Employee): boolean {
  return emp.password_changed === true
}

/**
 * 従業員番号を持っているかチェック
 */
export function hasEmployeeNumber(emp: Employee): emp is Employee & { employee_number: string } {
  return typeof emp.employee_number === 'string' && emp.employee_number.length > 0
}

/**
 * null または undefined をデフォルト値に変換
 */
export function ensureBoolean(value: boolean | null | undefined, defaultValue: boolean = false): boolean {
  return value ?? defaultValue
}

export function ensureString(value: string | null | undefined, defaultValue: string = ''): string {
  return value ?? defaultValue
}
