'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Edit3, Download, ClipboardList, X, Save } from 'lucide-react'

import { useShiftData } from '@/contexts/ShiftDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNonSystemEmployees } from '@/hooks/useNonSystemEmployees'
import { supabase } from '@/lib/supabase'
import type { ShiftSymbol, Employee, ShiftPattern } from '@/types'
import { getWeekKey } from '@/utils/dateUtils'

interface ShiftAssignment {
  symbol: ShiftSymbol
  patternId?: string
  reason?: string
}

interface ShiftPageProps {
  initialMonth?: string // YYYY-MM format
}

const ShiftPage: React.FC<ShiftPageProps> = ({ initialMonth }) => {
  // Contextからデータを取得
  const { employees, shiftPatterns, shiftData, updateShift } = useShiftData()
  const { user } = useAuth()

  // 印刷用のref
  const printRef = useRef<HTMLDivElement>(null)

  // ロールチェック
  const isAdminOrDeveloper = user?.role === 'admin' || user?.role === 'developer'

  // 現在の年月の1日を取得
  const getCurrentMonthStart = () => {
    if (initialMonth) {
      const [year, month] = initialMonth.split('-').map(Number)
      return new Date(year, month - 1, 1)
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const [currentDate, setCurrentDate] = useState(getCurrentMonthStart())
  const [editMode, setEditMode] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{employeeId: string, day: number, employeeName: string} | null>(null)

  const [editValues, setEditValues] = useState<{
    selectedPatternId: string | null
    isDeleting: boolean
  }>({
    selectedPatternId: null,
    isDeleting: false
  })

  // 今月のシフトデータ（表示用）
  const [currentMonthShifts, setCurrentMonthShifts] = useState<any[]>([])
  // 前月16日～今月15日のシフトデータ（勤務時間計算用）
  const [payrollPeriodShifts, setPayrollPeriodShifts] = useState<any[]>([])
  // 希望休データ
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])

  // システムアカウントを除外した従業員リスト
  const filteredEmployees = useNonSystemEmployees(employees)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // シフトデータを取得する関数
  const fetchShiftsData = async () => {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year

    // 表示月の最初の日（1日）が含まれる週の月曜日を取得
    const firstDayOfMonth = new Date(year, month, 1)
    const firstDayOfWeek = firstDayOfMonth.getDay() // 0=日, 1=月, ..., 6=土
    const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    const firstMonday = new Date(year, month, 1 - daysToMonday)

    // 表示月の最終日が含まれる週の日曜日を取得
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const lastDayOfWeek = lastDayOfMonth.getDay()
    const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
    const lastSunday = new Date(year, month + 1, 0 + daysToSunday)

    // 拡張されたデータ取得範囲（表示月を含む全週）
    const extendedStart = `${firstMonday.getFullYear()}-${String(firstMonday.getMonth() + 1).padStart(2, '0')}-${String(firstMonday.getDate()).padStart(2, '0')}`
    const extendedEnd = `${lastSunday.getFullYear()}-${String(lastSunday.getMonth() + 1).padStart(2, '0')}-${String(lastSunday.getDate()).padStart(2, '0')}`

    const { data: currentData, error: currentError } = await supabase
      .from('shifts')
      .select('*, shift_patterns(*)')
      .gte('date', extendedStart)
      .lte('date', extendedEnd)

    if (currentError) {
      console.error('シフト取得エラー:', currentError)
    } else {
      setCurrentMonthShifts(currentData || [])
      console.log(`${year}年${month + 1}月のシフト（拡張範囲）:`, currentData?.length, '件')
      console.log('取得範囲:', extendedStart, '〜', extendedEnd)
    }

    // 前月16日～今月15日のシフトデータを取得（労働時間集計期間）
    const payrollStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-16`
    const payrollEnd = `${year}-${String(month + 1).padStart(2, '0')}-15`

    const { data: payrollData, error: payrollError } = await supabase
      .from('shifts')
      .select('*, shift_patterns(*)')
      .gte('date', payrollStart)
      .lte('date', payrollEnd)

    if (payrollError) {
      console.error('労働時間集計期間のシフト取得エラー:', payrollError)
    } else {
      setPayrollPeriodShifts(payrollData || [])
      console.log('労働時間集計期間のシフト:', payrollData?.length, '件')
    }

    // 表示月の希望休データを取得（承認済みのみ）
    const currentMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDayNum = new Date(year, month + 1, 0).getDate()
    const currentMonthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`

    // まず全データを取得してステータスを確認
    const { data: allLeaveData, error: allLeaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .gte('date', currentMonthStart)
      .lte('date', currentMonthEnd)

    console.log('=== 希望休デバッグ ===')
    console.log('期間:', currentMonthStart, '～', currentMonthEnd)
    console.log('全希望休データ:', allLeaveData)
    if (allLeaveData && allLeaveData.length > 0) {
      console.log('最初のデータのstatus:', allLeaveData[0].status)
      console.log('statusの型:', typeof allLeaveData[0].status)
      allLeaveData.forEach((item, index) => {
        console.log(`データ${index + 1} - status: "${item.status}", leave_type: "${item.leave_type}", date: ${item.date}`)
      })
    }

    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', '承認')
      .gte('date', currentMonthStart)
      .lte('date', currentMonthEnd)

    if (leaveError) {
      console.error('希望休取得エラー:', leaveError)
    } else {
      setLeaveRequests(leaveData || [])
      console.log('承認済み希望休データ:', leaveData?.length, '件', leaveData)
    }
  }

  // 今月のシフトデータと労働時間集計期間のシフトデータを取得
  useEffect(() => {
    fetchShiftsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  // カレンダー日付生成
  const generateDays = () => {
    const daysArray = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.toLocaleDateString('ja-JP', { weekday: 'short' })
      daysArray.push({ 
        day, 
        dayOfWeek, 
        isSaturday: dayOfWeek === '土', 
        isSunday: dayOfWeek === '日' 
      })
    }
    return daysArray
  }
  const days = generateDays()

  // セルクリック時の編集モーダル表示
  const handleCellClick = (employeeId: string, day: number, employeeName: string) => {
    if (!editMode) return

    const dayInfo = days[day - 1]

    // 既存のシフトを取得
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const existingShift = currentMonthShifts.find(s => s.employee_id === employeeId && s.date === dateStr)

    setEditingCell({employeeId, day, employeeName})
    setEditValues({
      selectedPatternId: existingShift?.shift_pattern_id || null,
      isDeleting: false
    })
    setIsEditModalOpen(true)
  }

  // 編集内容保存
  const handleSaveEdit = async () => {
    if (!editingCell) return
    const { employeeId, day } = editingCell

    // 削除の場合
    if (editValues.isDeleting) {
      await handleDeleteShift()
      return
    }

    // シフトパターンが選択されていない場合
    if (!editValues.selectedPatternId) {
      alert('シフトパターンを選択してください')
      return
    }

    // 選択されたパターンから記号を取得
    const selectedPattern = shiftPatterns.find(p => p.id === editValues.selectedPatternId)
    if (!selectedPattern) {
      alert('シフトパターンが見つかりません')
      return
    }

    const newShift: ShiftAssignment = {
      symbol: selectedPattern.symbol,
      patternId: editValues.selectedPatternId,
      reason: undefined
    }

    // 現在表示中の年月を取得
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`

    // シフトを保存（完了を待つ）
    await updateShift(employeeId, day, newShift, yearMonth)

    // シフトデータを再取得して週間労働時間を更新
    await fetchShiftsData()

    handleCloseModal()
  }

  // シフト削除
  const handleDeleteShift = async () => {
    if (!editingCell) return

    if (!confirm('このシフトを削除しますか？')) {
      return
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(editingCell.day).padStart(2, '0')}`
    const existingShift = currentMonthShifts.find(
      s => s.employee_id === editingCell.employeeId && s.date === dateStr
    )

    if (existingShift) {
      try {
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', existingShift.id)

        if (error) throw error

        // ローカルの状態を更新
        setCurrentMonthShifts(prev => prev.filter(s => s.id !== existingShift.id))
        alert('シフトを削除しました')
      } catch (error) {
        console.error('シフト削除エラー:', error)
        alert('シフトの削除に失敗しました')
      }
    }

    handleCloseModal()
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingCell(null)
    setEditValues({
      selectedPatternId: null,
      isDeleting: false
    })
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month + (direction === 'prev' ? -1 : 1))
    setCurrentDate(newDate)
  }

  // 日付ごとの希望休ステータスを判定
  const getLeaveStatus = (employeeId: string, date: string) => {
    const leave = leaveRequests.find(lr =>
      lr.employee_id === employeeId &&
      lr.date === date
    )
    return leave ? leave.leave_type : null
  }

  // 希望休バッジコンポーネント
  const LeaveBadge = ({ leaveType }: { leaveType: string }) => {
    const badges: Record<string, { icon: string, text: string, bgColor: string }> = {
      '希望休': {
        icon: '🏖️',
        text: '希望休',
        bgColor: 'bg-gray-100 text-gray-700'
      },
      '出勤可能': {
        icon: '✅',
        text: '出勤可',
        bgColor: 'bg-blue-100 text-blue-700'
      },
      '有給': {
        icon: '🌴',
        text: '有給',
        bgColor: 'bg-green-100 text-green-700'
      }
    }

    const badge = badges[leaveType] || {
      icon: '📝',
      text: leaveType,
      bgColor: 'bg-gray-100 text-gray-600'
    }

    return (
      <span className={`text-[9px] px-1 py-0.5 rounded ${badge.bgColor} font-semibold whitespace-nowrap inline-block leading-tight leave-badge`}>
        {badge.icon} {badge.text}
      </span>
    )
  }

  // セル表示用のコンポーネント
  const renderShiftCell = (employee: Employee, day: number, dayInfo: { isSunday: boolean, isSaturday: boolean, dayOfWeek: string }) => {
    const isClinicClosed = dayInfo.dayOfWeek === '水' || dayInfo.isSunday

    const cellClass = `border-r border-gray-200 h-20 p-1 align-middle text-center shift-cell ${
      isClinicClosed ? 'bg-gray-100' : 'bg-white'
    } ${editMode && !isClinicClosed ? 'cursor-pointer hover:bg-yellow-100' : ''} transition-colors`

    // currentMonthShiftsから該当日のシフトを検索
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const shift = currentMonthShifts?.find(s => s.employee_id === employee.id && s.date === dateStr)

    // 希望休ステータスを取得
    const leaveStatus = getLeaveStatus(employee.id, dateStr)

    if (!shift) {
      // シフトなし + 希望休バッジのみ表示
      return (
        <td key={day} className={cellClass} onClick={() => handleCellClick(employee.id, day, employee.name)}>
          {leaveStatus && (
            <div className="h-full flex items-center justify-center">
              <LeaveBadge leaveType={leaveStatus} />
            </div>
          )}
        </td>
      )
    }

    // 記号の色分け（パターンに基づく）
    const getSymbolColor = (symbol: ShiftSymbol, patternId?: string) => {
      if (symbol === '×') return 'text-red-600 bg-red-100'
      
      const pattern = shiftPatterns.find(p => p.id === patternId)
      if (pattern) {
        // パターンの記号に応じて色分け
        switch (pattern.symbol) {
          case '○': return 'text-blue-600 bg-blue-100'
          case '▲': return 'text-green-600 bg-green-100'
          case '◆': return 'text-purple-600 bg-purple-100'
          case '✕': return 'text-orange-600 bg-orange-100'
          case '■': return 'text-gray-600 bg-gray-100'
          case '▶': return 'text-yellow-600 bg-yellow-100'
          default: return 'text-gray-600 bg-gray-100'
        }
      }
      
      return 'text-gray-600 bg-gray-100'
    }

    // shift.shift_patterns がリレーションデータ
    const pattern = shift.shift_patterns
    const timeInfo = pattern ? `${pattern.start_time}-${pattern.end_time}` : ''

    return (
      <td key={day} className={cellClass} onClick={() => handleCellClick(employee.id, day, employee.name)}>
        <div className="h-full flex flex-col items-center justify-center gap-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shift-symbol ${getSymbolColor(shift.shift_symbol as ShiftSymbol, shift.shift_pattern_id)}`}>
            {shift.shift_symbol}
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center w-full px-1">
            {timeInfo && (
              <span className="text-xs text-gray-500 whitespace-nowrap shift-time">
                {timeInfo}
              </span>
            )}
            {leaveStatus && (
              <LeaveBadge leaveType={leaveStatus} />
            )}
          </div>
        </div>
      </td>
    )
  }

  // 表示月に含まれる週のリストを生成（月曜始まり）
  const getWeeksInMonth = () => {
    const weeks: { start: Date; end: Date; weekKey: string }[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 最初の週の月曜日を取得
    const firstDayOfWeek = firstDay.getDay()
    const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    let currentMonday = new Date(year, month, 1 - daysToMonday)

    // 最終週の日曜日を取得
    const lastDayOfWeek = lastDay.getDay()
    const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
    const finalSunday = new Date(year, month + 1, 0 + daysToSunday)

    // 週ごとにループ
    while (currentMonday <= finalSunday) {
      const weekStart = new Date(currentMonday)
      const weekEnd = new Date(currentMonday)
      weekEnd.setDate(weekEnd.getDate() + 6) // 日曜日

      weeks.push({
        start: weekStart,
        end: weekEnd,
        weekKey: getWeekKey(weekStart)
      })

      currentMonday.setDate(currentMonday.getDate() + 7) // 次の月曜日
    }

    return weeks
  }

  // 労働時間統計計算（今月の予定出勤日数と前月16日～今月15日の勤務時間）
  const calculateMonthlyStats = (employeeId: string) => {
    // 今月の予定出勤日数を計算（暦月ベース）
    const currentMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const currentMonthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

    const employeeCurrentShifts = currentMonthShifts.filter(s =>
      s.employee_id === employeeId &&
      s.date >= currentMonthStart &&
      s.date <= currentMonthEnd
    )
    const totalDays = employeeCurrentShifts.filter(s => s.shift_symbol !== '×').length

    // 前月16日～今月15日の勤務時間を計算（労働時間集計期間）
    let totalHours = 0
    const employeePayrollShifts = payrollPeriodShifts.filter(s => s.employee_id === employeeId)

    employeePayrollShifts.forEach(shift => {
      if (shift.shift_symbol !== '×' && shift.shift_patterns) {
        const workMinutes = shift.shift_patterns.work_minutes || 0
        totalHours += workMinutes / 60
      }
    })

    return { totalDays, totalHours: Math.round(totalHours * 10) / 10 }
  }

  // 週ごとの労働時間と勤務日数を計算
  const calculateWeeklyStats = (employeeId: string, weekStart: Date, weekEnd: Date) => {
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
    const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`

    const employeeWeekShifts = currentMonthShifts.filter(s =>
      s.employee_id === employeeId &&
      s.date >= weekStartStr &&
      s.date <= weekEndStr
    )

    let weekHours = 0
    let weekDays = 0
    employeeWeekShifts.forEach(shift => {
      if (shift.shift_symbol !== '×' && shift.shift_patterns) {
        const workMinutes = shift.shift_patterns.work_minutes || 0
        weekHours += workMinutes / 60
        weekDays++
      }
    })

    return {
      hours: Math.round(weekHours * 10) / 10,
      days: weekDays
    }
  }

  // 従業員の制約表示
  const getEmployeeTypeDisplay = (employee: Employee): string => {
    return `週${employee.max_days_per_week}日・月${employee.max_hours_per_month}h`
  }

  // 従業員が利用可能なシフトパターンを取得
  const getAvailablePatternsForEmployee = (employeeId: string) => {
    const employee = filteredEmployees.find(e => e.id === employeeId)
    if (!employee) return []

    return shiftPatterns.filter(p =>
      employee.assignable_shift_pattern_ids.includes(p.id)
    )
  }

  // PDF出力ハンドラー - ブラウザの印刷機能を呼び出す
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-6 no-print">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <ClipboardList className="w-8 h-8" />
          シフト表示
        </h2>
        <p className="text-lg text-gray-600">作成されたシフトの確認・編集</p>
      </div>

      <div ref={printRef}>
      {/* 制御パネル */}
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth('prev')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors no-print">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800">{monthName}</h3>
            <button onClick={() => changeMonth('next')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors no-print">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-start gap-3 no-print">
            <button
              onClick={() => isAdminOrDeveloper && setEditMode(!editMode)}
              disabled={!isAdminOrDeveloper}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                !isAdminOrDeveloper
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : editMode
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? '編集中' : '編集'}
            </button>
            <div className="flex flex-col items-end gap-1">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg">
                <Download className="w-4 h-4" />
                PDF出力
              </button>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                💡 Windows:「Microsoft Print to PDF」/ Mac:「PDFとして保存」
              </div>
            </div>
          </div>
        </div>

        {/* 記号説明 - 動的なパターン表示 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm pattern-legend">
          {shiftPatterns.map(pattern => {
            const getPatternBgColor = (symbol: ShiftSymbol) => {
              switch (symbol) {
                case '○': return 'bg-blue-50'
                case '▲': return 'bg-green-50'
                case '◆': return 'bg-purple-50'
                case '✕': return 'bg-orange-50'
                case '■': return 'bg-gray-50'
                case '▶': return 'bg-yellow-50'
                default: return 'bg-gray-50'
              }
            }

            const getPatternTextColor = (symbol: ShiftSymbol) => {
              switch (symbol) {
                case '○': return 'text-blue-800'
                case '▲': return 'text-green-800'
                case '◆': return 'text-purple-800'
                case '✕': return 'text-orange-800'
                case '■': return 'text-gray-800'
                case '▶': return 'text-yellow-800'
                default: return 'text-gray-800'
              }
            }

            const getSymbolBgColor = (symbol: ShiftSymbol) => {
              switch (symbol) {
                case '○': return 'bg-blue-100 text-blue-600'
                case '▲': return 'bg-green-100 text-green-600'
                case '◆': return 'bg-purple-100 text-purple-600'
                case '✕': return 'bg-orange-100 text-orange-600'
                case '■': return 'bg-gray-100 text-gray-600'
                case '▶': return 'bg-yellow-100 text-yellow-600'
                default: return 'bg-gray-100 text-gray-600'
              }
            }

            return (
              <div key={pattern.id} className={`flex items-center gap-2 p-2 ${getPatternBgColor(pattern.symbol)} rounded-lg`}>
                <div className={`w-6 h-6 rounded-full ${getSymbolBgColor(pattern.symbol)} flex items-center justify-center font-bold`}>
                  {pattern.symbol}
                </div>
                <div className="flex flex-col">
                  <span className={`${getPatternTextColor(pattern.symbol)} font-medium`}>{pattern.name}</span>
                  <span className={`text-xs ${getPatternTextColor(pattern.symbol)} opacity-80`}>
                    {pattern.startTime}-{pattern.endTime}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* シフト表 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[800px] print-table">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-32 border-r border-gray-200 p-3 text-sm font-bold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  スタッフ
                </th>
                {days.map(({ day, dayOfWeek, isSaturday, isSunday }) => {
                  const isClinicClosed = dayOfWeek === '水' || isSunday
                  return (
                    <th key={day} className={`p-2 text-center font-medium text-gray-700 text-xs w-16 border-r border-gray-200 ${
                      isClinicClosed ? 'bg-gray-100' : 'bg-gray-50'
                    }`}>
                      <div className="font-bold">{day}</div>
                      <div className="text-xs">{dayOfWeek}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(employee => {
                const stats = calculateMonthlyStats(employee.id)
                const weeks = getWeeksInMonth()

                return (
                  <React.Fragment key={employee.id}>
                    {/* 従業員のシフト行 */}
                    <tr className="border-b border-gray-100">
                      <td className="sticky left-0 bg-white border-r border-gray-200 p-3 z-10">
                        <div className="text-sm font-semibold text-gray-800 employee-name">{employee.name}</div>
                        <div className="text-xs text-gray-600 stats-text">{getEmployeeTypeDisplay(employee)}</div>
                        <div className={`text-xs font-semibold mt-1 stats-text ${
                          stats.totalHours > employee.max_hours_per_month
                            ? 'text-red-600'
                            : 'text-blue-700'
                        }`}>
                          {stats.totalHours}h / {employee.max_hours_per_month}h
                          {stats.totalHours > employee.max_hours_per_month && ' ⚠️'}
                        </div>
                      </td>
                      {days.map(({ day, isSaturday, isSunday, dayOfWeek }) =>
                        renderShiftCell(employee, day, { isSaturday, isSunday, dayOfWeek })
                      )}
                    </tr>

                    {/* 週間労働時間表示行 */}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="sticky left-0 bg-gray-50 border-r border-gray-200 p-2 z-10">
                        <div className="text-xs text-gray-600 stats-text">勤務日数・労働時間</div>
                      </td>
                      {weeks.map((week, weekIndex) => {
                        const weekStats = calculateWeeklyStats(employee.id, week.start, week.end)
                        const hasMaxWeeklyHours = employee.max_hours_per_week !== undefined && employee.max_hours_per_week !== null
                        const hasMaxDaysPerWeek = employee.max_days_per_week !== undefined && employee.max_days_per_week !== null

                        const isWeeklyHoursOverLimit = hasMaxWeeklyHours && weekStats.hours > employee.max_hours_per_week!
                        const isWeeklyDaysOverLimit = hasMaxDaysPerWeek && weekStats.days > employee.max_days_per_week!
                        const isWeeklyOverLimit = isWeeklyHoursOverLimit || isWeeklyDaysOverLimit

                        // この週に含まれる日数を計算
                        const daysInWeek = days.filter(({ day }) => {
                          const date = new Date(year, month, day)
                          return date >= week.start && date <= week.end
                        })

                        return (
                          <td
                            key={weekIndex}
                            colSpan={daysInWeek.length}
                            className="p-2 text-center border-r border-gray-200"
                          >
                            <div className={`text-xs font-semibold inline-block px-2 py-1 rounded stats-text ${
                              isWeeklyOverLimit
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {hasMaxDaysPerWeek
                                ? `${weekStats.days}日 / ${employee.max_days_per_week}日`
                                : `${weekStats.days}日`
                              }
                              {isWeeklyDaysOverLimit && ' ⚠️'}
                              {' ・ '}
                              {hasMaxWeeklyHours
                                ? `${weekStats.hours}h / ${employee.max_hours_per_week}h`
                                : `${weekStats.hours}h`
                              }
                              {isWeeklyHoursOverLimit && ' ⚠️'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && editingCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCell.employeeName} - {editingCell.day}日
                </h3>
                <button onClick={handleCloseModal} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* シフトパターン選択 */}
              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-3">シフトパターン選択</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editingCell && getAvailablePatternsForEmployee(editingCell.employeeId).map((pattern) => {
                    const isSelected = editValues.selectedPatternId === pattern.id

                    // 記号の色を取得
                    const getSymbolBgColor = (symbol: ShiftSymbol) => {
                      switch (symbol) {
                        case '○': return 'bg-blue-100 text-blue-600'
                        case '▲': return 'bg-green-100 text-green-600'
                        case '◆': return 'bg-purple-100 text-purple-600'
                        case '✕': return 'bg-orange-100 text-orange-600'
                        case '■': return 'bg-gray-100 text-gray-600'
                        case '▶': return 'bg-yellow-100 text-yellow-600'
                        default: return 'bg-gray-100 text-gray-600'
                      }
                    }

                    return (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() => setEditValues({ selectedPatternId: pattern.id, isDeleting: false })}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${getSymbolBgColor(pattern.symbol)} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                          {pattern.symbol}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{pattern.name}</div>
                          <div className="text-sm text-gray-600">{pattern.startTime} - {pattern.endTime}</div>
                        </div>
                        {isSelected && (
                          <div className="text-indigo-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 既存シフトがある場合のみ削除ボタン表示 */}
              {editingCell && currentMonthShifts.find(s =>
                s.employee_id === editingCell.employeeId &&
                s.date === `${year}-${String(month + 1).padStart(2, '0')}-${String(editingCell.day).padStart(2, '0')}`
              ) && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditValues({ selectedPatternId: null, isDeleting: true })}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      editValues.isDeleting
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300 bg-white text-gray-700 hover:text-red-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    このシフトを削除
                  </button>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editValues.selectedPatternId && !editValues.isDeleting}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    editValues.selectedPatternId || editValues.isDeleting
                      ? editValues.isDeleting
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {editValues.isDeleting ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      削除
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ShiftPage