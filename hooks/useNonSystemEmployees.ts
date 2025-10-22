import { useMemo } from 'react'
import type { Employee } from '@/types'

/**
 * システムアカウントを除外した従業員リストを返すカスタムフック
 *
 * @param employees - 全従業員リスト
 * @returns システムアカウント以外の従業員リスト
 */
export function useNonSystemEmployees(employees: Employee[]): Employee[] {
  return useMemo(
    () => employees.filter(emp => !emp.is_system_account),
    [employees]
  )
}
