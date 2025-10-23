'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { ShiftPattern, Employee, LeaveRequest, EmployeeAccountInfo, JobType } from '@/types'
import { createEmployeeAccount } from '@/lib/auth-utils'
import { formatDate, getCurrentYearMonth, padZero } from '@/utils/dateFormat'
import { logError } from '@/lib/errorHandler'
import { toDomainEmployee } from '@/types/database'

// シフトデータの型定義
type ShiftSymbol = '○' | '▲' | '◆' | '×' | '✕' | '■' | '▶'

interface ShiftAssignment {
  symbol: ShiftSymbol
  patternId?: string
  reason?: string
}

interface ShiftData {
  [employeeId: string]: {
    [day: number]: ShiftAssignment
  }
}

interface Constraint {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Context の型定義
interface ShiftDataContextType {
  // シフトパターン
  shiftPatterns: ShiftPattern[]
  setShiftPatterns: React.Dispatch<React.SetStateAction<ShiftPattern[]>>
  addShiftPattern: (pattern: Omit<ShiftPattern, 'id'>) => void
  updateShiftPattern: (id: string, pattern: Partial<ShiftPattern>) => void
  deleteShiftPattern: (id: string) => void
  
  // 従業員情報（戻り値の型を変更）
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  addEmployee: (employee: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'user_id' | 'employee_number' | 'password_changed'>) => Promise<EmployeeAccountInfo>
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  
  // シフトデータ
  shiftData: ShiftData
  setShiftData: React.Dispatch<React.SetStateAction<ShiftData>>
  updateShift: (employeeId: string, day: number, shift: ShiftAssignment, yearMonth?: string) => void
  saveGeneratedShifts: (shifts: Array<{ date: string; employee_id: string; shift_pattern_id: string; notes?: string }>) => Promise<void>
  
  // 希望休データ
  leaveRequests: LeaveRequest[]
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) => void
  updateLeaveRequest: (id: string, request: Partial<LeaveRequest>) => void
  
  // 制約条件
  constraints: Constraint[]
  setConstraints: React.Dispatch<React.SetStateAction<Constraint[]>>
  addConstraint: (constraint: Omit<Constraint, 'id' | 'created_at' | 'updated_at'>) => void
  updateConstraint: (id: string, constraint: Partial<Constraint>) => void
  deleteConstraint: (id: string) => void
}

// Context の作成
const ShiftDataContext = createContext<ShiftDataContextType | undefined>(undefined)

// Provider コンポーネント
export function ShiftDataProvider({ children }: { children: ReactNode }) {
  // ============ シフトパターン ============
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([])

  // Supabaseからシフトパターンを取得
  const fetchShiftPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_patterns')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Supabaseの型からアプリの型に変換
      const patterns: ShiftPattern[] = (data || []).map(pattern => ({
        id: pattern.id,
        name: pattern.name,
        symbol: pattern.symbol as ShiftSymbol,
        startTime: pattern.start_time,
        endTime: pattern.end_time,
        workingHours: pattern.work_minutes / 60,
        breakMinutes: pattern.break_minutes,
        color: 'bg-blue-500'
      }))
      
      setShiftPatterns(patterns)
    } catch (error) {
      logError('シフトパターン取得', error)
    }
  }

  const addShiftPattern = async (pattern: Omit<ShiftPattern, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('shift_patterns')
        .insert({
          symbol: pattern.symbol,
          name: pattern.name,
          start_time: pattern.startTime,
          end_time: pattern.endTime,
          work_minutes: pattern.workingHours * 60,
          break_minutes: pattern.breakMinutes || 0
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const newPattern: ShiftPattern = {
          id: data.id,
          name: data.name,
          symbol: data.symbol as ShiftSymbol,
          startTime: data.start_time,
          endTime: data.end_time,
          workingHours: data.work_minutes / 60,
          breakMinutes: data.break_minutes,
          color: pattern.color
        }
        setShiftPatterns(prev => [...prev, newPattern])
      }
    } catch (error) {
      logError('シフトパターン追加', error)
    }
  }

  const updateShiftPattern = async (id: string, pattern: Partial<ShiftPattern>) => {
    try {
      const updates: any = {}
      if (pattern.symbol) updates.symbol = pattern.symbol
      if (pattern.name) updates.name = pattern.name
      if (pattern.startTime) updates.start_time = pattern.startTime
      if (pattern.endTime) updates.end_time = pattern.endTime
      if (pattern.workingHours !== undefined) updates.work_minutes = pattern.workingHours * 60
      if (pattern.breakMinutes !== undefined) updates.break_minutes = pattern.breakMinutes

      const { error } = await supabase
        .from('shift_patterns')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      setShiftPatterns(prev =>
        prev.map(p => (p.id === id ? { ...p, ...pattern } : p))
      )
    } catch (error) {
      logError('シフトパターン更新', error)
    }
  }

  const deleteShiftPattern = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shift_patterns')
        .delete()
        .eq('id', id)

      if (error) throw error
      setShiftPatterns(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      logError('シフトパターン削除', error)
    }
  }

  // ============ 従業員情報 ============
  const [employees, setEmployees] = useState<Employee[]>([])

  // Supabaseから従業員を取得（システムアカウント対応版）
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')  // is_system_account フィールドも含めて全て取得
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Supabaseの型からアプリの型に変換（型安全な変換関数を使用）
      const employeeData: Employee[] = (data || []).map(emp => {
        const empData = emp as any
        return toDomainEmployee({
          ...empData,
          available_days: empData.available_days || [],
          assignable_shift_pattern_ids: empData.assignable_shift_pattern_ids || [],
          is_active: empData.is_active ?? true,
        } as import('@/types/database').DatabaseEmployee)
      })
      
      setEmployees(employeeData)
    } catch (error) {
      logError('従業員取得', error)
    }
  }

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'user_id' | 'employee_number' | 'password_changed'>): Promise<EmployeeAccountInfo> => {
    try {
      // 独自認証システムでアカウント作成
      const accountInfo = await createEmployeeAccount({
        name: employeeData.name,
        employment_type: employeeData.employment_type,
        job_type: employeeData.job_type,
        max_days_per_week: employeeData.max_days_per_week,
        max_hours_per_month: employeeData.max_hours_per_month
      })
      
      // Supabaseからデータを再取得して状態を更新
      await fetchEmployees()
      
      return accountInfo
    } catch (error) {
      logError('従業員追加', error)
      throw error
    }
  }

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    try {
      const updates: any = {}
      if (employee.name) updates.name = employee.name
      if (employee.employment_type) updates.employment_type = employee.employment_type
      if (employee.job_type) updates.job_type = employee.job_type
      if (employee.max_days_per_week !== undefined) updates.max_days_per_week = employee.max_days_per_week
      if (employee.max_hours_per_month !== undefined) updates.max_hours_per_month = employee.max_hours_per_month
      if (employee.max_hours_per_week !== undefined) updates.max_hours_per_week = employee.max_hours_per_week
      if (employee.available_days !== undefined) updates.available_days = employee.available_days
      if (employee.assignable_shift_pattern_ids !== undefined) updates.assignable_shift_pattern_ids = employee.assignable_shift_pattern_ids
      if (employee.employee_number) updates.employee_number = employee.employee_number
      if (employee.password_changed !== undefined) updates.password_changed = employee.password_changed
      if (employee.is_system_account !== undefined) updates.is_system_account = employee.is_system_account

      updates.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setEmployees(prev =>
        prev.map(e => (e.id === id ? { ...e, ...employee, updated_at: new Date().toISOString() } : e))
      )
    } catch (error) {
      logError('従業員更新', error)
    }
  }

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEmployees(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      logError('従業員削除', error)
    }
  }

  // ============ シフトデータ ============
  const [shiftData, setShiftData] = useState<ShiftData>({})

  // Supabaseからシフトデータを取得
  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      
      // データを整形
      const shiftMap: ShiftData = {}
      data?.forEach(shift => {
        const date = new Date(shift.date)
        const day = date.getDate()
        
        if (!shiftMap[shift.employee_id]) {
          shiftMap[shift.employee_id] = {}
        }
        
        shiftMap[shift.employee_id][day] = {
          symbol: shift.shift_symbol as ShiftSymbol,
          patternId: undefined,
          reason: undefined
        }
      })
      
      setShiftData(shiftMap)
    } catch (error) {
      logError('シフトデータ取得', error)
    }
  }

  const updateShift = async (employeeId: string, day: number, shift: ShiftAssignment, yearMonth?: string) => {
    try {
      // 年月が指定されていない場合は現在の年月を使用
      const ym = yearMonth || getCurrentYearMonth()
      const date = `${ym}-${padZero(day)}`

      const { error } = await supabase
        .from('shifts')
        .upsert({
          employee_id: employeeId,
          date: date,
          shift_symbol: shift.symbol,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setShiftData(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [day]: shift
        }
      }))
    } catch (error) {
      logError('シフト更新', error)
    }
  }

  // AI生成シフトを一括保存
  const saveGeneratedShifts = async (shifts: Array<{
    date: string
    employee_id: string
    shift_pattern_id: string
    notes?: string
  }>) => {
    try {
      console.log('保存開始:', shifts.length, 'シフト')

      if (!shifts || shifts.length === 0) {
        throw new Error('保存するシフトがありません')
      }

      // まず既存のシフトを削除（対象月のみ）
      const targetMonth = shifts[0]?.date.substring(0, 7) // "2025-11"
      if (targetMonth) {
        const [year, month] = targetMonth.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate() // 月の最終日を動的に取得

        const startDate = `${targetMonth}-01`
        const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`

        console.log('既存シフト削除:', startDate, 'から', endDate)

        const { error: deleteError } = await supabase
          .from('shifts')
          .delete()
          .gte('date', startDate)
          .lte('date', endDate)

        if (deleteError) {
          logError('シフト削除', deleteError)
          throw deleteError
        }
      }

      // 新しいシフトを挿入
      const shiftsToInsert = shifts.map(shift => ({
        employee_id: shift.employee_id,
        date: shift.date,
        shift_pattern_id: shift.shift_pattern_id,
        shift_symbol: '○', // デフォルト記号（後で調整可能）
        actual_hours: 8, // デフォルト時間（後で調整可能）
        status: 'draft' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('挿入するシフト数:', shiftsToInsert.length)
      console.log('最初のシフトデータ:', shiftsToInsert[0])

      const { data: insertedData, error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert)
        .select()

      console.log('Supabase insert response:', { data: insertedData, error: insertError })

      if (insertError) {
        console.error('シフト挿入エラー詳細:', insertError)
        console.error('エラーコード:', insertError.code)
        console.error('エラーメッセージ:', insertError.message)
        console.error('エラー詳細:', insertError.details)
        console.error('エラーヒント:', insertError.hint)
        logError('シフト挿入', insertError)
        throw insertError
      }

      console.log('挿入成功:', insertedData?.length, 'レコード')

      // シフトデータを再取得
      await fetchShifts()

      console.log('保存完了')
    } catch (error) {
      logError('AI生成シフト保存', error)
      throw error
    }
  }

  // ============ 希望休データ ============
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  // Supabaseから希望休を取得
  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const requests: LeaveRequest[] = (data || []).map(req => ({
        id: req.id,
        employee_id: req.employee_id,
        date: req.date,
        leave_type: req.leave_type as LeaveRequest['leave_type'],
        reason: req.reason || undefined,
        status: req.status as '申請中' | '承認' | '却下',
        approved_by: req.approved_by || undefined,
        approved_at: req.approved_at || undefined,
        rejection_reason: req.rejection_reason || undefined,
        created_at: req.created_at,
        updated_at: req.updated_at
      }))
      
      setLeaveRequests(requests)
    } catch (error) {
      logError('希望休取得', error)
    }
  }

  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: request.employee_id,
          date: request.date,
          leave_type: request.leave_type,
          reason: request.reason || null,
          status: request.status || '申請中'
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const newRequest: LeaveRequest = {
          id: data.id,
          employee_id: data.employee_id,
          date: data.date,
          leave_type: data.leave_type as LeaveRequest['leave_type'],
          reason: data.reason || undefined,
          status: data.status as '申請中' | '承認' | '却下',
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        setLeaveRequests(prev => [newRequest, ...prev])
      }
    } catch (error) {
      logError('希望休追加', error)
    }
  }

  const updateLeaveRequest = async (id: string, request: Partial<LeaveRequest>) => {
    try {
      const updates: any = { ...request }
      updates.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      setLeaveRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, ...request, updated_at: new Date().toISOString() } : r))
      )
    } catch (error) {
      logError('希望休更新', error)
    }
  }

  // ============ 制約条件 ============
  const [constraints, setConstraints] = useState<Constraint[]>([])

  // Supabaseから制約条件を取得
  const fetchConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('constraints')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // null を空文字列に変換
      const constraintsData: Constraint[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        is_active: c.is_active,
        created_at: c.created_at,
        updated_at: c.updated_at
      }))
      
      setConstraints(constraintsData)
    } catch (error) {
      logError('制約条件取得', error)
    }
  }

  const addConstraint = async (constraint: Omit<Constraint, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('constraints')
        .insert({
          name: constraint.name,
          description: constraint.description || null,
          is_active: constraint.is_active
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        const newConstraint: Constraint = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        setConstraints(prev => [...prev, newConstraint])
      }
    } catch (error) {
      logError('制約条件追加', error)
    }
  }

  const updateConstraint = async (id: string, constraint: Partial<Constraint>) => {
    try {
      const updates: any = {}
      if (constraint.name !== undefined) updates.name = constraint.name
      if (constraint.description !== undefined) updates.description = constraint.description || null
      if (constraint.is_active !== undefined) updates.is_active = constraint.is_active
      updates.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('constraints')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      setConstraints(prev =>
        prev.map(c => (c.id === id ? { ...c, ...constraint, updated_at: new Date().toISOString() } : c))
      )
    } catch (error) {
      logError('制約条件更新', error)
    }
  }

  const deleteConstraint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('constraints')
        .delete()
        .eq('id', id)

      if (error) throw error
      setConstraints(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      logError('制約条件削除', error)
    }
  }

  // ============ 初回データ取得 ============
  useEffect(() => {
    fetchShiftPatterns()
    fetchEmployees()
    fetchShifts()
    fetchLeaveRequests()
    fetchConstraints()
  }, [])

  // Context の値
  const value: ShiftDataContextType = {
    shiftPatterns,
    setShiftPatterns,
    addShiftPattern,
    updateShiftPattern,
    deleteShiftPattern,
    
    employees,
    setEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    shiftData,
    setShiftData,
    updateShift,
    saveGeneratedShifts,
    
    leaveRequests,
    setLeaveRequests,
    addLeaveRequest,
    updateLeaveRequest,
    
    constraints,
    setConstraints,
    addConstraint,
    updateConstraint,
    deleteConstraint
  }

  return (
    <ShiftDataContext.Provider value={value}>
      {children}
    </ShiftDataContext.Provider>
  )
}

// カスタムフック
export function useShiftData() {
  const context = useContext(ShiftDataContext)
  if (context === undefined) {
    throw new Error('useShiftData must be used within a ShiftDataProvider')
  }
  return context
}