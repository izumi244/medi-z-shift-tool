'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, Users, X, Save, AlertTriangle } from 'lucide-react'
import { useShiftData } from '@/contexts/ShiftDataContext'
import { supabase } from '@/lib/supabase'
import type { ShiftPattern, ShiftSymbol } from '@/types'

interface Employee {
  id: string
  name: string
  employee_number: string | null
}

const ShiftPatternPage: React.FC = () => {
  // Contextからデータ取得
  const { shiftPatterns, addShiftPattern, updateShiftPattern, deleteShiftPattern } = useShiftData()
  
  // 状態管理
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null)
  const [deletingPattern, setDeletingPattern] = useState<ShiftPattern | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  
  // 利用可能な記号リスト（6種類）
  const availableSymbols: ShiftSymbol[] = ['○', '▲', '◆', '✕', '■', '▶']
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    workingHours: 0,
    breakMinutes: 60,
    symbol: '○' as ShiftSymbol,
    applicableStaff: [] as string[]
  })

  // 従業員データを取得
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_number')
        .eq('is_system_account', false)
        .order('name')

      if (error) {
        console.error('従業員データ取得エラー:', error)
        setEmployees([])
      } else {
        setEmployees(data || [])
      }
    } catch (error) {
      console.error('従業員データ取得エラー:', error)
      setEmployees([])
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  // 記号の色設定（6種類）
  const getSymbolColor = (symbol: ShiftSymbol): string => {
    const colors: Record<ShiftSymbol, string> = {
      '○': 'bg-blue-100 text-blue-800',
      '▲': 'bg-green-100 text-green-800', 
      '◆': 'bg-purple-100 text-purple-800',
      '×': 'bg-red-100 text-red-800',
      '✕': 'bg-orange-100 text-orange-800',
      '■': 'bg-gray-100 text-gray-800',
      '▶': 'bg-yellow-100 text-yellow-800'
    }
    return colors[symbol] || 'bg-gray-100 text-gray-800'
  }

  // 編集モーダルを開く
  const handleEdit = (pattern: ShiftPattern) => {
    setEditingPattern(pattern)
    setFormData({
      name: pattern.name,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      workingHours: pattern.workingHours,
      breakMinutes: pattern.breakMinutes || 60,
      symbol: pattern.symbol,
      applicableStaff: pattern.applicableStaff || []
    })
    setIsEditModalOpen(true)
  }

  // 新規パターン作成
  const handleAdd = () => {
    setEditingPattern(null)
    setFormData({
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      workingHours: 8,
      breakMinutes: 60,
      symbol: availableSymbols[0],
      applicableStaff: []
    })
    setIsEditModalOpen(true)
  }

  // 削除確認モーダルを開く
  const handleDeleteConfirm = (pattern: ShiftPattern) => {
    setDeletingPattern(pattern)
    setIsDeleteModalOpen(true)
  }

  // パターン削除実行
  const handleDelete = () => {
    if (deletingPattern) {
      deleteShiftPattern(deletingPattern.id)
      setIsDeleteModalOpen(false)
      setDeletingPattern(null)
    }
  }

  // 保存処理
  const handleSave = () => {
    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('必須項目を入力してください')
      return
    }

    if (editingPattern) {
      // 編集
      updateShiftPattern(editingPattern.id, {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workingHours: formData.workingHours,
        breakMinutes: formData.breakMinutes,
        symbol: formData.symbol,
        applicableStaff: formData.applicableStaff
      })
    } else {
      // 新規追加
      addShiftPattern({
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workingHours: formData.workingHours,
        breakMinutes: formData.breakMinutes,
        symbol: formData.symbol,
        applicableStaff: formData.applicableStaff
      })
    }

    setIsEditModalOpen(false)
    setEditingPattern(null)
  }

  // スタッフ選択切り替え
  const toggleStaff = (staff: string) => {
    setFormData(prev => ({
      ...prev,
      applicableStaff: prev.applicableStaff.includes(staff)
        ? prev.applicableStaff.filter(s => s !== staff)
        : [...prev.applicableStaff, staff]
    }))
  }

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8" />
          シフトパターン管理
        </h2>
        <p className="text-lg text-gray-600">勤務パターンの設定</p>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            新規パターン追加
          </button>
        </div>
      </div>

      {/* パターンカード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shiftPatterns.map((pattern) => {
          return (
            <div key={pattern.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* カードヘッダー */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{pattern.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(pattern)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(pattern)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {/* 時間表示 */}
                  <div className="text-gray-700">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Clock className="w-4 h-4" />
                      {pattern.startTime} - {pattern.endTime}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      実労働時間: {pattern.workingHours}時間 （休憩{pattern.breakMinutes || 0}分）
                    </div>
                  </div>

                  {/* 記号表示 */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getSymbolColor(pattern.symbol)}`}>
                    {pattern.symbol}
                  </div>
                </div>

                {/* 適用可能スタッフ */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">適用可能スタッフ</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(pattern.applicableStaff || []).length > 0 ? (
                      (pattern.applicableStaff || []).map((staff, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                        >
                          {staff}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">スタッフが設定されていません</span>
                    )}
                  </div>
                </div>
              </div>

              {/* パターン詳細 */}
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div><span className="font-medium">開始:</span> {pattern.startTime}</div>
                  <div><span className="font-medium">終了:</span> {pattern.endTime}</div>
                  <div><span className="font-medium">記号:</span> {pattern.symbol}</div>
                  <div><span className="font-medium">ID:</span> {pattern.id}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingPattern ? 'パターン編集' : '新規パターン作成'}
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* パターン名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">パターン名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900 placeholder:text-gray-400"
                  placeholder="例: パターンA"
                />
              </div>

              {/* 時間設定 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">開始時間</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">終了時間</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                  />
                </div>
              </div>

              {/* 実労働時間 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">実労働時間（時間）</label>
                <input
                  type="number"
                  value={formData.workingHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, workingHours: parseFloat(e.target.value) }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                  min="0"
                  max="24"
                  step="0.5"
                />
              </div>

              {/* 休憩時間 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">休憩時間（分）</label>
                <input
                  type="number"
                  value={formData.breakMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                  min="0"
                  step="15"
                />
              </div>

              {/* 記号選択（プルダウン） */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">記号選択</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value as ShiftSymbol }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
                >
                  {availableSymbols.map(symbol => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getSymbolColor(formData.symbol)}`}>
                    {formData.symbol}
                  </span>
                  <span className="text-sm text-gray-600">選択中の記号</span>
                </div>
              </div>

              {/* 適用可能スタッフ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">適用可能スタッフ</label>
                {isLoadingEmployees ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">従業員情報を読み込み中...</div>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-600 font-medium">登録された従業員がいません</div>
                    <div className="text-sm text-gray-500 mt-1">
                      従業員管理から従業員を追加してください
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {employees.map(employee => (
                      <label key={employee.id} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.applicableStaff.includes(employee.name)}
                          onChange={() => toggleStaff(employee.name)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{employee.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPattern ? '更新' : '作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {isDeleteModalOpen && deletingPattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">パターン削除確認</h3>
              <p className="text-gray-600 mb-6">
                「{deletingPattern.name}」を削除しますか？<br />
                この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShiftPatternPage