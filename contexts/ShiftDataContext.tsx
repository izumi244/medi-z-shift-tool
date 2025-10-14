'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { ShiftPattern, Employee, LeaveRequest } from '@/types'

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
  
  // 従業員情報
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  addEmployee: (employee: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at'>) => void
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  
  // シフトデータ
  shiftData: ShiftData
  setShiftData: React.Dispatch<React.SetStateAction<ShiftData>>
  updateShift: (employeeId: string, day: number, shift: ShiftAssignment) => void
  
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
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([
    {
      id: '1',
      name: 'パターンA',
      symbol: '○',
      startTime: '09:00',
      endTime: '18:00',
      workingHours: 8,
      breakMinutes: 60,
      applicableStaff: ['富沢', '田中'],
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'パターンB',
      symbol: '○',
      startTime: '09:00',
      endTime: '16:00',
      workingHours: 6,
      breakMinutes: 60,
      applicableStaff: ['富沢', '田中'],
      color: 'bg-blue-400'
    },
    {
      id: '3',
      name: 'パターンC',
      symbol: '▲',
      startTime: '09:00',
      endTime: '13:00',
      workingHours: 4,
      breakMinutes: 0,
      applicableStaff: ['富沢'],
      color: 'bg-green-500'
    },
    {
      id: '4',
      name: 'パターンD',
      symbol: '◆',
      startTime: '14:00',
      endTime: '18:00',
      workingHours: 4,
      breakMinutes: 0,
      applicableStaff: ['富沢'],
      color: 'bg-purple-500'
    },
    {
      id: '5',
      name: 'パターンE',
      symbol: '○',
      startTime: '09:00',
      endTime: '17:00',
      workingHours: 7,
      breakMinutes: 60,
      applicableStaff: ['桐山'],
      color: 'bg-orange-500'
    }
  ])

  const addShiftPattern = (pattern: Omit<ShiftPattern, 'id'>) => {
    const newPattern = {
      ...pattern,
      id: (shiftPatterns.length + 1).toString()
    }
    setShiftPatterns(prev => [...prev, newPattern])
  }

  const updateShiftPattern = (id: string, pattern: Partial<ShiftPattern>) => {
    setShiftPatterns(prev =>
      prev.map(p => (p.id === id ? { ...p, ...pattern } : p))
    )
  }

  const deleteShiftPattern = (id: string) => {
    setShiftPatterns(prev => prev.filter(p => p.id !== id))
  }

  // ============ 従業員情報 ============
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: '富沢',
      employment_type: 'パート',
      job_type: '医療事務',
      max_days_per_week: 4,
      max_hours_per_month: 100,
      max_hours_per_week: 26,
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '2', '3', '4'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: '田中',
      employment_type: 'パート',
      job_type: '医療事務',
      max_days_per_week: 5,
      max_hours_per_month: 117,
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '2'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: '桐山',
      employment_type: 'パート',
      job_type: '医療事務',
      max_days_per_week: 4,
      max_hours_per_month: 100,
      available_days: ['月', '火', '水', '木', '金'],
      assignable_shift_pattern_ids: ['5'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'ヘルプ',
      employment_type: 'パート',
      job_type: '医療事務',
      max_days_per_week: 0,
      max_hours_per_month: 0,
      available_days: [],
      assignable_shift_pattern_ids: [],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ])

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'is_active' | 'created_at' | 'updated_at'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setEmployees(prev => [...prev, newEmployee])
  }

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, ...employee, updated_at: new Date().toISOString() } : e))
    )
  }

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  // ============ シフトデータ（2025年10月専用） ============
  const [shiftData, setShiftData] = useState<ShiftData>({
    '1': { // 富沢
      2: { symbol: '▲', patternId: '3' },
      3: { symbol: '○', patternId: '1' },
      6: { symbol: '◆', patternId: '4' },
      7: { symbol: '○', patternId: '1' },
      9: { symbol: '▲', patternId: '3' },
      10: { symbol: '○', patternId: '1' },
      14: { symbol: '◆', patternId: '4' },
      16: { symbol: '○', patternId: '2' },
      17: { symbol: '▲', patternId: '3' },
      21: { symbol: '○', patternId: '1' },
      23: { symbol: '◆', patternId: '4' },
      24: { symbol: '○', patternId: '1' },
      28: { symbol: '▲', patternId: '3' },
      30: { symbol: '○', patternId: '2' },
      31: { symbol: '◆', patternId: '4' }
    },
    '2': { // 田中
      2: { symbol: '○', patternId: '1' },
      3: { symbol: '○', patternId: '1' },
      4: { symbol: '○', patternId: '2' },
      6: { symbol: '○', patternId: '1' },
      7: { symbol: '○', patternId: '1' },
      9: { symbol: '○', patternId: '1' },
      10: { symbol: '○', patternId: '1' },
      11: { symbol: '○', patternId: '2' },
      13: { symbol: '○', patternId: '1' },
      14: { symbol: '○', patternId: '1' },
      16: { symbol: '×', reason: '有給' },
      17: { symbol: '○', patternId: '1' },
      18: { symbol: '○', patternId: '2' },
      20: { symbol: '○', patternId: '1' },
      21: { symbol: '○', patternId: '1' },
      23: { symbol: '○', patternId: '1' },
      24: { symbol: '○', patternId: '1' },
      25: { symbol: '○', patternId: '2' },
      27: { symbol: '○', patternId: '1' },
      28: { symbol: '○', patternId: '1' }
    },
    '3': { // 桐山
      2: { symbol: '○', patternId: '5' },
      3: { symbol: '○', patternId: '5' },
      6: { symbol: '○', patternId: '5' },
      7: { symbol: '○', patternId: '5' },
      9: { symbol: '○', patternId: '5' },
      10: { symbol: '○', patternId: '5' },
      13: { symbol: '○', patternId: '5' },
      14: { symbol: '○', patternId: '5' },
      16: { symbol: '○', patternId: '5' },
      17: { symbol: '○', patternId: '5' },
      20: { symbol: '×', reason: '希望休' },
      21: { symbol: '○', patternId: '5' },
      23: { symbol: '○', patternId: '5' },
      24: { symbol: '○', patternId: '5' },
      27: { symbol: '○', patternId: '5' },
      28: { symbol: '○', patternId: '5' },
      30: { symbol: '○', patternId: '5' },
      31: { symbol: '○', patternId: '5' }
    },
    '4': { // ヘルプ
      6: { symbol: '×', reason: '休み' },
      13: { symbol: '×', reason: '休み' },
      20: { symbol: '×', reason: '休み' },
      27: { symbol: '×', reason: '休み' }
    }
  })

  const updateShift = (employeeId: string, day: number, shift: ShiftAssignment) => {
    setShiftData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [day]: shift
      }
    }))
  }

  // ============ 希望休データ ============
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: '1',
      employee_id: '1',
      date: '2025-10-20',
      leave_type: '希望休',
      reason: '家族の用事',
      status: '申請中',
      created_at: '2025-10-01T09:00:00Z',
      updated_at: '2025-10-01T09:00:00Z'
    },
    {
      id: '2',
      employee_id: '2',
      date: '2025-10-16',
      leave_type: '有給',
      reason: '旅行',
      status: '承認',
      created_at: '2025-09-25T14:30:00Z',
      updated_at: '2025-09-26T10:15:00Z',
      approved_by: 'admin',
      approved_at: '2025-09-26T10:15:00Z'
    },
    {
      id: '3',
      employee_id: '3',
      date: '2025-10-20',
      leave_type: '希望休',
      reason: '私用',
      status: '承認',
      created_at: '2025-10-05T16:45:00Z',
      updated_at: '2025-10-06T09:20:00Z',
      approved_by: 'admin',
      approved_at: '2025-10-06T09:20:00Z'
    }
  ])

  const addLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: (leaveRequests.length + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setLeaveRequests(prev => [...prev, newRequest])
  }

  const updateLeaveRequest = (id: string, request: Partial<LeaveRequest>) => {
    setLeaveRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, ...request, updated_at: new Date().toISOString() } : r))
    )
  }

  // ============ 制約条件 ============
  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      id: '1',
      name: '希望休優先',
      description: '希望休の申請を最優先とする',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'シフトパターン制約',
      description: 'パターンC（▲）とパターンD（◆）は同日どちらか片方のみとする',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ])

  const addConstraint = (constraint: Omit<Constraint, 'id' | 'created_at' | 'updated_at'>) => {
    const newConstraint: Constraint = {
      ...constraint,
      id: (constraints.length + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setConstraints(prev => [...prev, newConstraint])
  }

  const updateConstraint = (id: string, constraint: Partial<Constraint>) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, ...constraint, updated_at: new Date().toISOString() } : c))
    )
  }

  const deleteConstraint = (id: string) => {
    setConstraints(prev => prev.filter(c => c.id !== id))
  }

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