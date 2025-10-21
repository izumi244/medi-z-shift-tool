'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Edit3, Download, ClipboardList, X, Save } from 'lucide-react'
import { useShiftData } from '@/contexts/ShiftDataContext'
import { supabase } from '@/lib/supabase'
import type { ShiftSymbol, Employee, ShiftPattern } from '@/types'

interface ShiftAssignment {
  symbol: ShiftSymbol
  patternId?: string
  reason?: string
}

const ShiftPage: React.FC = () => {
  // Contextからデータを取得
  const { employees, shiftPatterns, shiftData, updateShift } = useShiftData()
  
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)) // 2025年10月
  const [editMode, setEditMode] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{employeeId: string, day: number, employeeName: string} | null>(null)
  
  const [editValues, setEditValues] = useState({
    symbol: '○' as ShiftSymbol,
    reason: ''
  })

  // 今月のシフトデータ（表示用）
  const [currentMonthShifts, setCurrentMonthShifts] = useState<any[]>([])
  // 前月16日～今月15日のシフトデータ（勤務時間計算用）
  const [payrollPeriodShifts, setPayrollPeriodShifts] = useState<any[]>([])

  // システムアカウントを除外した従業員リスト
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => !employee.is_system_account)
  }, [employees])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 今月のシフトデータと給与計算期間のシフトデータを取得
  useEffect(() => {
    const fetchShiftsData = async () => {
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year

      // 今月のシフトデータを取得（表示用）
      const currentMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      // 月末日を正しく取得（28〜31日まで対応）
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
      const currentMonthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

      const { data: currentData, error: currentError } = await supabase
        .from('shifts')
        .select('*, shift_patterns(*)')
        .gte('date', currentMonthStart)
        .lte('date', currentMonthEnd)

      if (currentError) {
        console.error('今月のシフト取得エラー:', currentError)
      } else {
        setCurrentMonthShifts(currentData || [])
        console.log(`${year}年${month + 1}月のシフト:`, currentData?.length, '件')
      }

      // 前月16日～今月15日のシフトデータを取得（給与計算期間）
      const payrollStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-16`
      const payrollEnd = `${year}-${String(month + 1).padStart(2, '0')}-15`

      const { data: payrollData, error: payrollError } = await supabase
        .from('shifts')
        .select('*, shift_patterns(*)')
        .gte('date', payrollStart)
        .lte('date', payrollEnd)

      if (payrollError) {
        console.error('給与計算期間のシフト取得エラー:', payrollError)
      } else {
        setPayrollPeriodShifts(payrollData || [])
        console.log('給与計算期間のシフト:', payrollData?.length, '件')
      }
    }

    fetchShiftsData()
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

    // 水曜日と日曜日はクリニック休診
    if (dayInfo?.dayOfWeek === '水' || dayInfo?.dayOfWeek === '日') {
      alert('水曜日と日曜日はクリニック休診日です。')
      return
    }

    const shift = shiftData[employeeId]?.[day]
    setEditingCell({employeeId, day, employeeName})

    setEditValues({
      symbol: shift?.symbol || '○',
      reason: shift?.reason || ''
    })
    setIsEditModalOpen(true)
  }

  // 編集内容保存
  const handleSaveEdit = () => {
    if (!editingCell) return
    const { employeeId, day } = editingCell

    const newShift: ShiftAssignment = {
      symbol: editValues.symbol,
      reason: editValues.symbol === '×' ? editValues.reason : undefined,
      patternId: getPatternIdFromSymbol(editValues.symbol, employeeId)
    }

    updateShift(employeeId, day, newShift)
    handleCloseModal()
  }

  // 記号からパターンIDを取得（動的に判定）
  const getPatternIdFromSymbol = (symbol: ShiftSymbol, employeeId: string): string | undefined => {
    const employee = filteredEmployees.find(e => e.id === employeeId)
    if (!employee || symbol === '×') return undefined

    // 従業員と記号に基づいてパターンを検索
    const matchingPatterns = shiftPatterns.filter(p => 
      p.symbol === symbol && p.applicableStaff?.includes(employee.name)
    )

    return matchingPatterns.length > 0 ? matchingPatterns[0].id : undefined
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingCell(null)
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month + (direction === 'prev' ? -1 : 1))
    setCurrentDate(newDate)
  }

  // セル表示用のコンポーネント
  const renderShiftCell = (employee: Employee, day: number, dayInfo: { isSunday: boolean, isSaturday: boolean, dayOfWeek: string }) => {
    const isClinicClosed = dayInfo.dayOfWeek === '水' || dayInfo.isSunday

    const cellClass = `border-r border-gray-200 h-20 p-1 align-middle text-center ${
      isClinicClosed ? 'bg-gray-100' : 'bg-white'
    } ${editMode && !isClinicClosed ? 'cursor-pointer hover:bg-yellow-100' : ''} transition-colors`

    // currentMonthShiftsから該当日のシフトを検索
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const shift = currentMonthShifts.find(s => s.employee_id === employee.id && s.date === dateStr)

    if (!shift) {
      return <td key={day} className={cellClass} onClick={() => handleCellClick(employee.id, day, employee.name)} />
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
        <div className="h-full flex flex-col items-center justify-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${getSymbolColor(shift.shift_symbol as ShiftSymbol, shift.shift_pattern_id)}`}>
            {shift.shift_symbol}
          </div>
          {timeInfo && (
            <div className="text-xs text-gray-500 mt-1 w-full text-center px-1">
              {timeInfo}
            </div>
          )}
        </div>
      </td>
    )
  }

  // 労働時間統計計算（今月の予定出勤日数と前月16日～今月15日の勤務時間）
  const calculateMonthlyStats = (employeeId: string) => {
    // 今月の予定出勤日数を計算
    const employeeCurrentShifts = currentMonthShifts.filter(s => s.employee_id === employeeId)
    const totalDays = employeeCurrentShifts.filter(s => s.shift_symbol !== '×').length

    // 前月16日～今月15日の勤務時間を計算（給与計算期間）
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

  // 従業員の制約表示
  const getEmployeeTypeDisplay = (employee: Employee): string => {
    return `週${employee.max_days_per_week}日・月${employee.max_hours_per_month}h`
  }

  // 利用可能なシフト記号を取得
  const getAvailableSymbols = (): ShiftSymbol[] => {
    const symbolsSet = new Set<ShiftSymbol>()
    shiftPatterns.forEach(pattern => {
      symbolsSet.add(pattern.symbol)
    })
    symbolsSet.add('×') // 休みは常に追加
    return Array.from(symbolsSet)
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <ClipboardList className="w-8 h-8" />
          シフト表示
        </h2>
        <p className="text-lg text-gray-600">作成されたシフトの確認・編集</p>
      </div>

      {/* 制御パネル */}
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth('prev')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800">{monthName}</h3>
            <button onClick={() => changeMonth('next')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                editMode ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? '編集中' : '編集'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg">
              <Download className="w-4 h-4" />
              PDF出力
            </button>
          </div>
        </div>

        {/* 記号説明 - 動的なパターン表示 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
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
                    {pattern.start_time}-{pattern.end_time}
                  </span>
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">×</div>
            <div className="flex flex-col">
              <span className="text-red-800 font-medium">休み</span>
            </div>
          </div>
        </div>
      </div>

      {/* シフト表 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[800px]">
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
                return (
                  <tr key={employee.id} className="border-b border-gray-200">
                    <td className="sticky left-0 bg-white border-r border-gray-200 p-3 z-10">
                      <div className="text-sm font-semibold text-gray-800">{employee.name}</div>
                      <div className="text-xs text-gray-600">{getEmployeeTypeDisplay(employee)}</div>
                      <div className="text-xs text-gray-500">{stats.totalDays}日・{stats.totalHours}h</div>
                    </td>
                    {days.map(({ day, isSaturday, isSunday, dayOfWeek }) => 
                      renderShiftCell(employee, day, { isSaturday, isSunday, dayOfWeek })
                    )}
                  </tr>
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
              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-3">記号選択</div>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableSymbols().map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => setEditValues(prev => ({ ...prev, symbol: symbol as ShiftSymbol }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        editValues.symbol === symbol
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl font-bold mb-1">{symbol}</div>
                    </button>
                  ))}
                </div>
              </div>

              {editValues.symbol === '×' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">休みの理由</label>
                  <select
                    value={editValues.reason}
                    onChange={(e) => setEditValues(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                  >
                    <option value="">選択してください</option>
                    <option value="希望休">希望休</option>
                    <option value="有給">有給</option>
                    <option value="休み">休み</option>
                    <option value="忌引">忌引</option>
                    <option value="病欠">病欠</option>
                  </select>
                </div>
              )}

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
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShiftPage