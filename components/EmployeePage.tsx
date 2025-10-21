'use client'

import React, { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Filter, X, Save, Clock, Calendar, CheckSquare, Key, Copy, Check } from 'lucide-react'
import { useShiftData } from '@/contexts/ShiftDataContext'
import type { Employee, EmploymentType, JobType, EmployeeAccountInfo } from '@/types'

interface EmployeeFormData {
  name: string
  employment_type: EmploymentType
  job_type: JobType
  available_days: string[]
  assignable_shift_pattern_ids: string[]
  max_days_per_week: number
  max_hours_per_month: number
  max_hours_per_week?: number
}

const EmployeePage: React.FC = () => {
  // Contextからデータ取得・更新関数を取得
  const { employees, shiftPatterns, addEmployee, updateEmployee, deleteEmployee } = useShiftData()
  
  // 状態管理
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | EmploymentType>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // アカウント情報モーダル用の状態
  const [showAccountInfo, setShowAccountInfo] = useState(false)
  const [accountInfo, setAccountInfo] = useState<EmployeeAccountInfo | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // フォームデータ
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    employment_type: 'パート',
    job_type: '医療事務',
    available_days: [],
    assignable_shift_pattern_ids: [],
    max_days_per_week: 5,
    max_hours_per_month: 160,
    max_hours_per_week: undefined
  })

  // 曜日選択肢
  const weekdays = ['月', '火', '水', '木', '金', '土', '日']

  // 職種アイコン
  const jobTypeIcons: Record<JobType, string> = {
    '医療事務': '📋'
  }

  // フィルタリングされた従業員リスト（システムアカウント除外対応）
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || employee.employment_type === filterType
    
    // システムアカウントを除外（オプションB）
    const isNotSystemAccount = !employee.is_system_account
    
    return matchesSearch && matchesFilter && isNotSystemAccount
  })

  // モーダル開閉
  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        name: employee.name,
        employment_type: employee.employment_type,
        job_type: employee.job_type,
        available_days: employee.available_days,
        assignable_shift_pattern_ids: employee.assignable_shift_pattern_ids,
        max_days_per_week: employee.max_days_per_week,
        max_hours_per_month: employee.max_hours_per_month,
        max_hours_per_week: employee.max_hours_per_week
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        name: '',
        employment_type: 'パート',
        job_type: '医療事務',
        available_days: [],
        assignable_shift_pattern_ids: [],
        max_days_per_week: 5,
        max_hours_per_month: 160,
        max_hours_per_week: undefined
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
  }

  // アカウント情報モーダル開閉
  const closeAccountInfo = () => {
    setShowAccountInfo(false)
    setAccountInfo(null)
    setCopiedField(null)
    closeModal() // 従業員編集モーダルも閉じる
  }

  // クリップボードにコピー
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('コピーに失敗しました:', error)
    }
  }

  // 保存処理（非同期対応）
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('氏名を入力してください')
      return
    }

    setIsLoading(true)
    try {
      if (editingEmployee) {
        // 更新
        updateEmployee(editingEmployee.id, {
          name: formData.name,
          employment_type: formData.employment_type,
          job_type: formData.job_type,
          available_days: formData.available_days,
          assignable_shift_pattern_ids: formData.assignable_shift_pattern_ids,
          max_days_per_week: formData.max_days_per_week,
          max_hours_per_month: formData.max_hours_per_month,
          max_hours_per_week: formData.max_hours_per_week
        })
        closeModal()
      } else {
        // 新規追加（アカウント情報を取得）
        const newAccountInfo = await addEmployee({
          name: formData.name,
          employment_type: formData.employment_type,
          job_type: formData.job_type,
          available_days: formData.available_days,
          assignable_shift_pattern_ids: formData.assignable_shift_pattern_ids,
          max_days_per_week: formData.max_days_per_week,
          max_hours_per_month: formData.max_hours_per_month,
          max_hours_per_week: formData.max_hours_per_week
        })
        
        // アカウント情報モーダルを表示
        setAccountInfo(newAccountInfo)
        setShowAccountInfo(true)
        // 編集モーダルは開いたまま（アカウント情報モーダルを閉じた時に一緒に閉じる）
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 削除処理
  const handleDelete = (id: string) => {
    if (confirm('この従業員を削除しますか？')) {
      deleteEmployee(id)
    }
  }

  // 曜日選択切り替え
  const toggleWeekday = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }))
  }

  // シフトパターン選択切り替え
  const toggleShiftPattern = (patternId: string) => {
    setFormData(prev => ({
      ...prev,
      assignable_shift_pattern_ids: prev.assignable_shift_pattern_ids.includes(patternId)
        ? prev.assignable_shift_pattern_ids.filter(p => p !== patternId)
        : [...prev.assignable_shift_pattern_ids, patternId]
    }))
  }

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8" />
          従業員管理
        </h2>
        <p className="text-lg text-gray-600">従業員情報・勤務制約設定</p>
      </div>

      {/* 検索・フィルター・アクション */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* 検索バー */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="氏名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* フィルター */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | EmploymentType)}
              className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors appearance-none bg-white min-w-[150px] text-gray-900"
            >
              <option value="all">全ての雇用形態</option>
              <option value="パート">パート</option>
            </select>
          </div>
        </div>

        {/* 新規追加ボタン */}
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          新規従業員追加
        </button>
      </div>

      {/* 従業員テーブル */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">氏名</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">雇用/職種</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">労働時間制約</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">対応シフト</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">勤務可能曜日</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                        {jobTypeIcons[employee.job_type]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{employee.name}</div>
                        {employee.employee_number && (
                          <div className="text-sm text-gray-500">ID: {employee.employee_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.employment_type}
                      </span>
                      <div className="text-sm text-gray-600">{employee.job_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        週{employee.max_days_per_week}日
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <Clock className="w-4 h-4" />
                        月{employee.max_hours_per_month}h
                      </div>
                      {employee.max_hours_per_week && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-4 h-4" />
                          週{employee.max_hours_per_week}h制限
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {employee.assignable_shift_pattern_ids.map(patternId => {
                        const pattern = shiftPatterns.find(p => p.id === patternId)
                        return pattern ? (
                          <span key={pattern.id} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            {pattern.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.available_days.map(day => (
                        <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {day}
                        </span>
                      ))}
                      {employee.available_days.length === 0 && (
                        <span className="text-gray-400 text-sm">なし</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(employee)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                        disabled={employee.name === 'ヘルプ'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 従業員が見つからない場合の表示 */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || filterType !== 'all' 
                ? '条件に一致する従業員が見つかりません' 
                : '従業員が登録されていません'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterType !== 'all' 
                ? '検索条件を変更してください' 
                : '新規従業員追加ボタンから従業員を登録してください'}
            </p>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingEmployee ? '従業員編集' : '新規従業員追加'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* 基本情報 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />基本情報
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      氏名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900 placeholder:text-gray-400"
                      placeholder="氏名を入力"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      雇用形態 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value as EmploymentType }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                      disabled={isLoading}
                    >
                      <option value="パート">パート</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      職種 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.job_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_type: e.target.value as JobType }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                      disabled={isLoading}
                    >
                      <option value="医療事務">医療事務</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 労働時間制約 */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />労働時間制約
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">週最大勤務日数</label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={formData.max_days_per_week}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_days_per_week: parseInt(e.target.value) }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">月最大労働時間(16日-15日)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_hours_per_month}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_hours_per_month: parseInt(e.target.value) }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">週最大労働時間(時間)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_hours_per_week || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_hours_per_week: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900 placeholder:text-gray-400"
                      placeholder="任意"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* 勤務可能曜日 */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />勤務可能曜日
                </h4>
                <div className="grid grid-cols-7 gap-2">
                  {weekdays.map(day => (
                    <label key={day} className="flex items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.available_days.includes(day)}
                        onChange={() => toggleWeekday(day)}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <span className={`font-semibold ${
                        formData.available_days.includes(day) 
                          ? 'text-green-700 bg-green-100' 
                          : 'text-gray-600'
                      } px-3 py-2 rounded`}>
                        {day}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 対応可能シフトパターン */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />対応可能シフトパターン
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shiftPatterns.map(pattern => (
                    <label key={pattern.id} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.assignable_shift_pattern_ids.includes(pattern.id)}
                        onChange={() => toggleShiftPattern(pattern.id)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {pattern.symbol}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700">{pattern.name}</div>
                        <div className="text-sm text-gray-500">{pattern.startTime}-{pattern.endTime}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingEmployee ? '更新' : '追加'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アカウント情報表示モーダル */}
      {showAccountInfo && accountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Key className="w-6 h-6 text-green-600" />
                  アカウント作成完了
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  従業員を追加しました
                </h4>
                <p className="text-gray-600 text-sm">
                  以下のログイン情報を従業員にお伝えください
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-700 text-sm font-semibold mb-2">
                  ⚠️ この画面は一度しか表示されません
                </p>
                <p className="text-orange-600 text-xs">
                  ログイン情報を必ずメモまたはコピーしてください
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    従業員番号
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-lg font-mono">
                      {accountInfo.employee_number}
                    </code>
                    <button
                      onClick={() => copyToClipboard(accountInfo.employee_number, 'employee_number')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      title="コピー"
                    >
                      {copiedField === 'employee_number' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    初期パスワード
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-lg font-mono">
                      {accountInfo.initial_password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(accountInfo.initial_password, 'password')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      title="コピー"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <strong>初回ログイン時：</strong>パスワードの変更が必要です
                </p>
              </div>

              <button
                onClick={closeAccountInfo}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeePage