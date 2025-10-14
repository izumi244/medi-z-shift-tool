'use client';

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, X, Save, Clock, Calendar, CheckSquare } from 'lucide-react';

// 型定義をローカルで定義
type EmploymentType = 'パート';
type JobType = '医療事務';

interface Employee {
  id: string;
  name: string;
  employment_type: EmploymentType;
  job_type: JobType;
  available_days: string[];  // 勤務可能曜日
  assignable_shift_pattern_ids: string[];  // 対応可能シフトパターン
  
  // 新要件：労働時間制約
  max_days_per_week: number;     // 週最大勤務日数
  max_hours_per_month: number;   // 月最大労働時間（16日-15日）
  max_hours_per_week?: number;   // 週最大労働時間
  
  phone?: string;
  email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmployeeFormData {
  name: string;
  employment_type: EmploymentType;
  job_type: JobType;
  available_days: string[];
  assignable_shift_pattern_ids: string[];
  max_days_per_week: number;
  max_hours_per_month: number;
  max_hours_per_week?: number;
  phone?: string;
  email?: string;
  notes?: string;
}

const EmployeePage: React.FC = () => {
  // 状態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | EmploymentType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    employment_type: 'パート',
    job_type: '医療事務',
    available_days: [],
    assignable_shift_pattern_ids: [],
    max_days_per_week: 5,
    max_hours_per_month: 160,
    max_hours_per_week: undefined,
    phone: '',
    email: '',
    notes: ''
  });

  // 従業員データ（4名固定）
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: '富沢',
      employment_type: 'パート',
      job_type: '医療事務',
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '3', '4'], // パターンA, C, D
      max_days_per_week: 4,
      max_hours_per_month: 100,
      max_hours_per_week: 26,
      phone: '090-1234-5678',
      email: 'tomizawa@example.com',
      notes: '週4日・月100h（短時間対応）',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: '田中',
      employment_type: 'パート',
      job_type: '医療事務',
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '2'], // パターンA, B
      max_days_per_week: 5,
      max_hours_per_month: 117,
      phone: '090-2345-6789',
      email: 'tanaka@example.com',
      notes: '週5日・月117h（フルタイム）',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: '桐山',
      employment_type: 'パート',
      job_type: '医療事務',
      available_days: ['月', '火', '水', '木', '金'], // 土曜不可
      assignable_shift_pattern_ids: ['5'], // パターンE
      max_days_per_week: 4,
      max_hours_per_month: 100,
      phone: '090-3456-7890',
      email: 'kirayama@example.com',
      notes: '週4日・月100h（土曜不可）',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'ヘルプ',
      employment_type: 'パート',
      job_type: '医療事務',
      available_days: [],
      assignable_shift_pattern_ids: [],
      max_days_per_week: 0,
      max_hours_per_month: 0,
      notes: '表示のみ（シフト組み込み対象外）',
      is_active: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]);

  // シフトパターン選択肢
  const shiftPatterns = [
    { id: '1', name: 'パターンA', symbol: '○', description: '09:00-18:00' },
    { id: '2', name: 'パターンB', symbol: '○', description: '09:00-16:00' },
    { id: '3', name: 'パターンC', symbol: '▲', description: '09:00-13:00' },
    { id: '4', name: 'パターンD', symbol: '◆', description: '14:00-18:00' },
    { id: '5', name: 'パターンE', symbol: '○', description: '09:00-17:00' }
  ];

  // 曜日選択肢
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

  // 職種アイコン
  const jobTypeIcons = {
    '医療事務': '📋'
  };

  // フィルタリングされた従業員リスト
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || employee.employment_type === filterType;
    return matchesSearch && matchesFilter;
  });

  // モーダル開閉
  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        employment_type: employee.employment_type,
        job_type: employee.job_type,
        available_days: employee.available_days,
        assignable_shift_pattern_ids: employee.assignable_shift_pattern_ids,
        max_days_per_week: employee.max_days_per_week,
        max_hours_per_month: employee.max_hours_per_month,
        max_hours_per_week: employee.max_hours_per_week,
        phone: employee.phone || '',
        email: employee.email || '',
        notes: employee.notes || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        employment_type: 'パート',
        job_type: '医療事務',
        available_days: [],
        assignable_shift_pattern_ids: [],
        max_days_per_week: 5,
        max_hours_per_month: 160,
        max_hours_per_week: undefined,
        phone: '',
        email: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // 保存処理
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('氏名を入力してください');
      return;
    }

    const newEmployee: Employee = {
      id: editingEmployee?.id || Date.now().toString(),
      name: formData.name,
      employment_type: formData.employment_type,
      job_type: formData.job_type,
      available_days: formData.available_days,
      assignable_shift_pattern_ids: formData.assignable_shift_pattern_ids,
      max_days_per_week: formData.max_days_per_week,
      max_hours_per_month: formData.max_hours_per_month,
      max_hours_per_week: formData.max_hours_per_week,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes,
      is_active: true,
      created_at: editingEmployee?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? newEmployee : emp));
    } else {
      setEmployees(prev => [...prev, newEmployee]);
    }

    closeModal();
  };

  // 削除処理
  const handleDelete = (id: string) => {
    if (confirm('この従業員を削除しますか？')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  // 曜日選択切り替え
  const toggleWeekday = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  // シフトパターン選択切り替え
  const toggleShiftPattern = (patternId: string) => {
    setFormData(prev => ({
      ...prev,
      assignable_shift_pattern_ids: prev.assignable_shift_pattern_ids.includes(patternId)
        ? prev.assignable_shift_pattern_ids.filter(p => p !== patternId)
        : [...prev.assignable_shift_pattern_ids, patternId]
    }));
  };

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
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
            />
          </div>

          {/* フィルター */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | EmploymentType)}
              className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors appearance-none bg-white min-w-[150px]"
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
                        <div className="text-sm text-gray-500">ID: {employee.id}</div>
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
                        const pattern = shiftPatterns.find(p => p.id === patternId);
                        return pattern ? (
                          <span key={pattern.id} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            {pattern.name}
                          </span>
                        ) : null;
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
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      placeholder="例：富沢"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      雇用形態 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value as EmploymentType }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
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
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      週最大勤務日数
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={formData.max_days_per_week}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_days_per_week: parseInt(e.target.value) }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      月最大労働時間（16日-15日）
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_hours_per_month}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_hours_per_month: parseInt(e.target.value) }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      週最大労働時間（時間）
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_hours_per_week || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_hours_per_week: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      placeholder="任意"
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
                      />
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {pattern.symbol}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700">{pattern.name}</div>
                        <div className="text-sm text-gray-500">{pattern.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 連絡先・備考 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">連絡先・備考</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                      placeholder="example@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">備考</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors resize-none"
                    rows={3}
                    placeholder="特記事項があれば記入"
                  />
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
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
                  {editingEmployee ? '更新' : '追加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;