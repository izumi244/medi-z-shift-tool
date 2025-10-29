'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react'
import { useShiftData } from '@/contexts/ShiftDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentYearMonth } from '@/utils/dateFormat'
import type { LeaveRequest, RequestStatus } from '@/types'

const LeavePage: React.FC = () => {
  // Contextからデータ取得（ローカル状態管理から変更）
  const { employees, leaveRequests, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } = useShiftData()
  const { user } = useAuth()

  const [currentMonth, setCurrentMonth] = useState(getCurrentYearMonth())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)
  const [requestType, setRequestType] = useState<'leave' | 'work'>('leave')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null)
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [leaveToReject, setLeaveToReject] = useState<LeaveRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // ログインユーザーの情報を取得
  const currentUserRole = user?.role || 'employee'
  const currentUserId = user?.id || ''

  // ログインユーザーに対応する従業員IDを取得
  const currentEmployee = employees.find(emp => emp.employee_number === user?.employee_number)
  const currentEmployeeId = currentEmployee?.id || ''

  // プルダウンに表示する従業員リスト
  const selectableEmployees = (() => {
    // 開発者・管理者の場合：システムアカウント以外の全従業員を表示
    if (currentUserRole === 'admin' || currentUserRole === 'developer') {
      return employees.filter((emp) => !emp.is_system_account)
    }

    // 従業員の場合：自分自身のみ表示
    if (currentUserRole === 'employee' && currentEmployeeId) {
      return employees.filter((emp) => emp.id === currentEmployeeId)
    }

    // その他の場合：空配列
    return []
  })()

  // デバッグ用ログ
  console.log('ログインユーザー:', { role: currentUserRole, employeeId: currentEmployeeId })
  console.log('選択可能な従業員:', selectableEmployees.map(e => ({ name: e.name, id: e.id })))

  // フォームデータ
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    leave_type: '希望休' as LeaveRequest['leave_type'],
    reason: ''
  })

  // 従業員名を取得
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) {
      console.warn(`従業員が見つかりません: ${employeeId}`)
      return '不明'
    }
    return employee.name
  }

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    const date = new Date(currentMonth)
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    setCurrentMonth(date.toISOString().slice(0, 7))
  }

  // カレンダー用の日付計算
  const getDaysInMonth = (month: string) => {
    const date = new Date(month)
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfWeek = (month: string) => {
    const date = new Date(month)
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // 希望休申請を承認（updateLeaveRequest関数を使用）
  const approveLeave = (id: string) => {
    // 承認は管理者と開発者のみ可能
    if (currentUserRole !== 'admin' && currentUserRole !== 'developer') {
      alert('承認する権限がありません')
      return
    }

    updateLeaveRequest(id, {
      status: '承認',
      approved_by: user?.employee_number || user?.name || 'unknown',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  // 却下確認ダイアログを開く
  const openRejectConfirm = (leave: LeaveRequest) => {
    // 却下は管理者と開発者のみ可能
    if (currentUserRole !== 'admin' && currentUserRole !== 'developer') {
      alert('却下する権限がありません')
      return
    }
    setLeaveToReject(leave)
    setRejectReason('')
    setRejectConfirmOpen(true)
  }

  // 希望休申請を却下（updateLeaveRequest関数を使用）
  const rejectLeave = () => {
    if (!leaveToReject || !rejectReason.trim()) {
      alert('却下理由を入力してください')
      return
    }

    updateLeaveRequest(leaveToReject.id, {
      status: '却下',
      rejection_reason: rejectReason,
      updated_at: new Date().toISOString()
    })

    setRejectConfirmOpen(false)
    setLeaveToReject(null)
    setRejectReason('')
  }

  // 削除権限チェック
  const canDelete = (leave: LeaveRequest): boolean => {
    // 開発者・管理者は全て削除可能
    if (currentUserRole === 'developer' || currentUserRole === 'admin') {
      return true
    }

    // 一般従業員は申請中の自分の申請のみ削除可能
    if (currentUserRole === 'employee') {
      return leave.status === '申請中' && leave.employee_id === currentEmployeeId
    }

    return false
  }

  // 削除確認ダイアログを開く
  const openDeleteConfirm = (leave: LeaveRequest) => {
    setLeaveToDelete(leave)
    setDeleteConfirmOpen(true)
  }

  // 削除実行
  const handleDelete = async () => {
    if (!leaveToDelete) return

    try {
      await deleteLeaveRequest(leaveToDelete.id)
      setDeleteConfirmOpen(false)
      setLeaveToDelete(null)
      if (selectedLeave?.id === leaveToDelete.id) {
        setSelectedLeave(null)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const openModal = () => {
    setRequestType('leave')
    setFormData({
      employee_id: '',
      date: '',
      leave_type: '希望休',
      reason: ''
    })
    setIsModalOpen(true)
  }

  // 新規申請を追加（addLeaveRequest関数を使用）
  const addRequest = async () => {
    try {
      const finalLeaveType = requestType === 'work' ? '出勤可能' : formData.leave_type

      await addLeaveRequest({
        employee_id: formData.employee_id,
        date: formData.date,
        leave_type: finalLeaveType,
        reason: formData.reason,
        status: '申請中'
      })

      setIsModalOpen(false)
      alert('申請しました')
    } catch (error) {
      console.error('申請エラー:', error)
      alert('申請に失敗しました。もう一度お試しください。')
    }
  }

  // フィルタリングされた希望休（現在の月のみ）
  const filteredLeaves = leaveRequests.filter(leave => {
    return leave.date.startsWith(currentMonth)
  })

  // カレンダーのレンダリング用データ
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfWeek(currentMonth)
    const days = []

    // 前月の空の日
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // 現在月の日
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentMonth}-${day.toString().padStart(2, '0')}`
      const dayLeaves = filteredLeaves.filter(leave => leave.date === date)
      days.push({ day, date, leaves: dayLeaves })
    }

    return days
  }

  // ステータスアイコンを取得
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case '申請中':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case '承認':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case '却下':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  // ステータス用のスタイルクラス
  const getStatusStyles = (status: RequestStatus) => {
    switch (status) {
      case '申請中':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        }
      case '承認':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200'
        }
      case '却下':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        }
    }
  }

  const leaveTypeColors: Record<LeaveRequest['leave_type'], string> = {
    '希望休': 'bg-blue-100 text-blue-800',
    '有給': 'bg-green-100 text-green-800',
    '忌引': 'bg-gray-100 text-gray-800',
    '病欠': 'bg-red-100 text-red-800',
    'その他': 'bg-purple-100 text-purple-800',
    '出勤可能': 'bg-cyan-100 text-cyan-800'
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          希望休・出勤管理
        </h2>
        <p className="text-lg text-gray-600">
          スタッフの希望休や出勤可能日などの申請・承認を管理します
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">申請中</div>
              <div className="text-xl font-bold text-yellow-600">
                {leaveRequests.filter(l => l.status === '申請中').length}件
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">承認済み</div>
              <div className="text-xl font-bold text-green-600">
                {leaveRequests.filter(l => l.status === '承認').length}件
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">却下</div>
              <div className="text-xl font-bold text-red-600">
                {leaveRequests.filter(l => l.status === '却下').length}件
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">今月合計</div>
              <div className="text-xl font-bold text-blue-600">
                {filteredLeaves.length}件
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作バー */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* 月選択 */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200">
          <button
            onClick={() => changeMonth('prev')}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 min-w-[100px] text-center">
            {currentMonth.replace('-', '年')}月
          </span>
          <button
            onClick={() => changeMonth('next')}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 追加ボタン */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          新規申請
        </button>
      </div>

      {/* カレンダー表示 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays().map((dayData, index) => (
            <div key={index} className="min-h-[100px] p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              {dayData && (
                <>
                  <div className="font-semibold text-gray-800 mb-2">{dayData.day}</div>
                  <div className="space-y-1">
                    {dayData.leaves.map((leave) => {
                      const styles = getStatusStyles(leave.status)
                      return (
                        <button
                          key={leave.id}
                          className={`text-xs p-2 rounded cursor-pointer ${styles.bg} ${styles.border} border w-full text-left`}
                          onClick={() => setSelectedLeave(leave)}
                          title={`${getEmployeeName(leave.employee_id)} - ${leave.leave_type}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(leave.status)}
                            <span className={`font-medium truncate ${styles.text}`}>
                              {getEmployeeName(leave.employee_id)}
                            </span>
                          </div>
                          <div className={`text-xs opacity-75 truncate ${styles.text}`}>
                            {leave.leave_type}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 新規申請モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-indigo-600">新規申請</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <div id="request-type-label" className="block text-sm font-semibold text-gray-700 mb-2">申請種別</div>
                <div role="group" aria-labelledby="request-type-label" className="flex bg-gray-100 rounded-lg p-1">
                  <button type="button" onClick={() => setRequestType('leave')} className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${requestType === 'leave' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}>希望休申請</button>
                  <button type="button" onClick={() => setRequestType('work')} className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${requestType === 'work' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-600'}`}>出勤可能申請</button>
                </div>
              </div>

              <div>
                <label htmlFor="employee-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  スタッフ <span className="text-red-500">*</span>
                </label>
                <select
                  id="employee-select"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                >
                  <option value="">選択してください</option>
                  {selectableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="text-gray-800">
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="leave-date" className="block text-sm font-semibold text-gray-700 mb-2">
                  希望日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="leave-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                />
              </div>

              {requestType === 'leave' && (
                <div>
                  <label htmlFor="leave-type" className="block text-sm font-semibold text-gray-700 mb-2">
                    種類 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="leave-type"
                    value={formData.leave_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value as any }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                  >
                    <option value="希望休" className="text-gray-800">希望休</option>
                    <option value="有給" className="text-gray-800">有給</option>
                    <option value="忌引" className="text-gray-800">忌引</option>
                    <option value="病欠" className="text-gray-800">病欠</option>
                    <option value="その他" className="text-gray-800">その他</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="leave-reason" className="block text-sm font-semibold text-gray-700 mb-2">
                  {requestType === 'leave' ? '理由' : '補足事項'}
                </label>
                <textarea
                  id="leave-reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors resize-none text-gray-800"
                  placeholder={requestType === 'leave' ? '例：家族の用事、旅行など' : '例：急な欠員が出た場合、対応可能です'}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={addRequest}
                  disabled={!formData.employee_id || !formData.date}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  申請
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 詳細表示モーダル */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-indigo-600">申請詳細</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-1">スタッフ</div>
                  <p className="text-gray-900 font-medium">{getEmployeeName(selectedLeave.employee_id)}</p>
                </div>

              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-1">希望日</div>
                <p className="text-gray-900 font-medium">
                  {new Date(selectedLeave.date).toLocaleDateString('ja-JP')}
                </p>
              </div>

              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-1">種類</div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leaveTypeColors[selectedLeave.leave_type]}`}>
                  {selectedLeave.leave_type}
                </span>
              </div>

              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-1">{selectedLeave.leave_type === '出勤可能' ? '補足事項' : '理由'}</div>
                <p className="text-gray-900">{selectedLeave.reason}</p>
              </div>

              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-1">ステータス</div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusStyles(selectedLeave.status).bg} ${getStatusStyles(selectedLeave.status).border} border w-fit`}>
                  {getStatusIcon(selectedLeave.status)}
                  <span className={`text-sm font-medium ${getStatusStyles(selectedLeave.status).text}`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="block text-sm font-semibold text-gray-700 mb-1">申請日</div>
                <p className="text-gray-900">
                  {new Date(selectedLeave.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>

              {selectedLeave.status === '申請中' && (currentUserRole === 'admin' || currentUserRole === 'developer') && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      approveLeave(selectedLeave.id)
                      setSelectedLeave(null)
                    }}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => {
                      openRejectConfirm(selectedLeave)
                      setSelectedLeave(null)
                    }}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    却下
                  </button>
                </div>
              )}

              {canDelete(selectedLeave) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openDeleteConfirm(selectedLeave)}
                    className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirmOpen && leaveToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-600">削除確認</h3>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-900">以下の申請を削除してもよろしいですか？</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">スタッフ:</span>
                  <span className="font-medium">{getEmployeeName(leaveToDelete.employee_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">日付:</span>
                  <span className="font-medium">{new Date(leaveToDelete.date).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">種類:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leaveTypeColors[leaveToDelete.leave_type]}`}>
                    {leaveToDelete.leave_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ステータス:</span>
                  <span className={`text-sm font-medium ${getStatusStyles(leaveToDelete.status).text}`}>
                    {leaveToDelete.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-red-600 font-semibold">この操作は取り消せません。</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 却下理由入力ダイアログ */}
      {rejectConfirmOpen && leaveToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-600">却下理由の入力</h3>
              <button
                onClick={() => setRejectConfirmOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-900">以下の申請を却下します：</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">スタッフ:</span>
                  <span className="font-medium">{getEmployeeName(leaveToReject.employee_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">日付:</span>
                  <span className="font-medium">{new Date(leaveToReject.date).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">種類:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leaveTypeColors[leaveToReject.leave_type]}`}>
                    {leaveToReject.leave_type}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="reject-reason" className="block text-sm font-semibold text-gray-700 mb-2">
                  却下理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-colors resize-none text-gray-800"
                  placeholder="例：その日は既に人員が足りています"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectConfirmOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={rejectLeave}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
              >
                却下
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeavePage