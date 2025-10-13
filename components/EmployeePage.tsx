'use client';

import React, { useState } from 'react';

import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Calendar,
  Clock,
  Target
} from 'lucide-react';

import type { ShiftPattern, Employee, EmploymentType, JobType } from '@/types';

const EmployeePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');

  // 5つの固定シフトパターン
  const shiftPatterns: ShiftPattern[] = [
    {
      id: '1',
      name: 'フルタイム平日',
      start_time: '09:00',
      end_time: '18:00',
      break_minutes: 60,
      symbol: '○',
      applicable_staff: ['富沢', '田中']
    },
    {
      id: '2', 
      name: '土曜勤務',
      start_time: '09:00',
      end_time: '16:00',
      break_minutes: 60,
      symbol: '○',
      applicable_staff: ['富沢', '田中']
    },
    {
      id: '3',
      name: '富沢午前短時間',
      start_time: '09:00',
      end_time: '13:00',
      break_minutes: 0,
      symbol: '▲',
      applicable_staff: ['富沢']
    },
    {
      id: '4',
      name: '富沢午後短時間',
      start_time: '14:00',
      end_time: '18:00',
      break_minutes: 0,
      symbol: '◆',
      applicable_staff: ['富沢']
    },
    {
      id: '5',
      name: '桐山専用パターン',
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 60,
      symbol: '○',
      applicable_staff: ['桐山']
    }
  ];

  // 4名の固定スタッフ
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: '富沢',
      employment_type: 'パート',
      job_type: '看護師',
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '2', '3', '4'], // 全パターン可能
      max_days_per_week: 4,
      max_hours_per_month: 100,
      max_hours_per_week: 26,
      is_active: true,
      created_at: '2025-08-01T09:00:00Z',
      updated_at: '2025-08-01T09:00:00Z'
    },
    {
      id: '2',
      name: '田中',
      employment_type: '常勤',
      job_type: '看護師',
      available_days: ['月', '火', '水', '木', '金', '土'],
      assignable_shift_pattern_ids: ['1', '2'], // フルタイムと土曜のみ
      max_days_per_week: 5,
      max_hours_per_month: 117,
      is_active: true,
      created_at: '2025-08-02T10:30:00Z',
      updated_at: '2025-08-02T10:30:00Z'
    },
    {
      id: '3',
      name: '桐山',
      employment_type: '常勤',
      job_type: '臨床検査技師',
      available_days: ['月', '火', '水', '木', '金'], // 土曜勤務不可
      assignable_shift_pattern_ids: ['5'], // 桐山専用パターンのみ
      max_days_per_week: 4,
      max_hours_per_month: 100,
      is_active: true,
      created_at: '2025-08-03T14:15:00Z',
      updated_at: '2025-08-03T14:15:00Z'
    },
    {
      id: '4',
      name: 'ヘルプ',
      employment_type: 'パート',
      job_type: '看護師',
      available_days: [],
      assignable_shift_pattern_ids: [], // シフト組み込み不要
      max_days_per_week: 0,
      max_hours_per_month: 0,
      is_active: true,
      created_at: '2025-08-04T16:20:00Z',
      updated_at: '2025-08-04T16:20:00Z'
    }
  ]);

  const dayOptions = ['月', '火', '水', '木', '金', '土'];

  const getInitialFormData = () => ({
    name: '',
    employment_type: '常勤' as EmploymentType,
    job_type: '看護師' as JobType,
    available_days: ['月', '火', '水', '木', '金'],
    assignable_shift_pattern_ids: [] as string[],
    max_days_per_week: 5,
    max_hours_per_month: 100,
    max_hours_per_week: undefined as number | undefined
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const filteredEmployees = employees.filter(emp => emp.is_active && emp.name.toLowerCase().includes(searchText.toLowerCase()));

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        employment_type: employee.employment_type,
        job_type: employee.job_type,
        available_days: employee.available_days,
        assignable_shift_pattern_ids: employee.assignable_shift_pattern_ids || [],
        max_days_per_week: employee.max_days_per_week,
        max_hours_per_month: employee.max_hours_per_month,
        max_hours_per_week: employee.max_hours_per_week
      });
    } else {
      setEditingEmployee(null);
      setFormData(getInitialFormData());
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const saveEmployee = () => {
    const now = new Date().toISOString();

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...emp, ...formData, updated_at: now } as Employee
          : emp
      ));
    } else {
      const newEmployee: Employee = {
        id: (employees.length + 1).toString(),
        ...formData,
        is_active: true,
        created_at: now,
        updated_at: now
      };
      setEmployees(prev => [...prev, newEmployee]);
    }
    
    closeModal();
  };

  const deleteEmployee = (id: string) => {
    if (confirm('このスタッフを削除しますか？')) {
      setEmployees(prev => prev.map(emp => 
        emp.id === id ? { ...emp, is_active: false } : emp
      ));
    }
  };

  const updateCheckboxArray = <K extends keyof typeof formData>(field: K, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  const employmentTypeColors = {
    '常勤': 'bg-blue-100 text-blue-800 border-blue-200',
    'パート': 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const jobTypeIcons = {
    '看護師': '🩺',
    '臨床検査技師': '🔬'
  };

  const getSymbolColor = (symbol: string): string => {
    switch (symbol) {
      case '○': return 'bg-blue-100 text-blue-800';
      case '▲': return 'bg-green-100 text-green-800'; 
      case '◆': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8" />
          スタッフ管理
        </h2>
        <p className="text-lg text-gray-600">
          スタッフの基本情報、勤務制約、対応シフトパターンを管理
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="スタッフ名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors w-full md:w-64 text-gray-800"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          新規スタッフ追加
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
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
                      <div className="font-semibold text-gray-900">{employee.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${employmentTypeColors[employee.employment_type]} w-fit`}>
                        {employee.employment_type}
                      </span>
                      <span className="text-sm text-gray-700">{employee.job_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-gray-500" />
                        <span>週{employee.max_days_per_week}日</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>月{employee.max_hours_per_month}h</span>
                      </div>
                      {employee.max_hours_per_week && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock className="w-3 h-3" />
                          <span>週{employee.max_hours_per_week}h</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {employee.assignable_shift_pattern_ids.map(patternId => {
                        const pattern = shiftPatterns.find(p => p.id === patternId);
                        return pattern ? (
                          <span key={patternId} className={`px-2 py-1 rounded text-xs font-bold ${getSymbolColor(pattern.symbol)}`}>
                            {pattern.symbol} {pattern.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.available_days.map((day) => (
                        <span key={day} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {day}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(employee)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEmployee(employee.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="削除"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-indigo-600">
                {editingEmployee ? 'スタッフ編集' : '新規スタッフ追加'}
              </h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />基本情報
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="employee-name" className="block text-sm font-semibold text-gray-700 mb-2">
                      氏名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="employee-name" 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800" 
                      placeholder="例：富沢"
                    />
                  </div>
                  <div>
                    <label htmlFor="employment-type" className="block text-sm font-semibold text-gray-700 mb-2">
                      雇用形態 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="employment-type" 
                      value={formData.employment_type} 
                      onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value as EmploymentType }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                    >
                      <option value="常勤">常勤</option>
                      <option value="パート">パート</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="job-type" className="block text-sm font-semibold text-gray-700 mb-2">
                      職種 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="job-type" 
                      value={formData.job_type} 
                      onChange={(e) => setFormData(prev => ({ ...prev, job_type: e.target.value as JobType }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                    >
                      <option value="看護師">看護師</option>
                      <option value="臨床検査技師">臨床検査技師</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 労働時間制約 */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />労働時間制約
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="max-days-per-week" className="block text-sm font-semibold text-gray-700 mb-2">
                      週最大勤務日数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="max-days-per-week" 
                      type="number" 
                      min="0" 
                      max="6" 
                      value={formData.max_days_per_week} 
                      onChange={(e) => setFormData(prev => ({ ...prev, max_days_per_week: parseInt(e.target.value) || 0 }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-hours-per-month" className="block text-sm font-semibold text-gray-700 mb-2">
                      月最大労働時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="max-hours-per-month" 
                      type="number" 
                      min="0" 
                      value={formData.max_hours_per_month} 
                      onChange={(e) => setFormData(prev => ({ ...prev, max_hours_per_month: parseInt(e.target.value) || 0 }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                    />
                    <p className="text-xs text-gray-600 mt-1">16日〜翌月15日の期間</p>
                  </div>
                  <div>
                    <label htmlFor="max-hours-per-week" className="block text-sm font-semibold text-gray-700 mb-2">
                      週最大労働時間 <span className="text-gray-500">（任意）</span>
                    </label>
                    <input
                      id="max-hours-per-week" 
                      type="number" 
                      min="0" 
                      value={formData.max_hours_per_week || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, max_hours_per_week: e.target.value ? parseInt(e.target.value) : undefined }))} 
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                      placeholder="制限なし"
                    />
                    <p className="text-xs text-orange-600 mt-1">富沢は26時間</p>
                  </div>
                </div>
              </div>

              {/* 対応可能シフトパターン */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />対応可能シフトパターン
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shiftPatterns.map(pattern => (
                    <label key={pattern.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 bg-white hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.assignable_shift_pattern_ids.includes(pattern.id)}
                        onChange={() => updateCheckboxArray('assignable_shift_pattern_ids', pattern.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getSymbolColor(pattern.symbol)}`}>
                        {pattern.symbol}
                      </span>
                      <div>
                        <span className="font-medium text-gray-800">{pattern.name}</span>
                        <div className="text-xs text-gray-600">{pattern.start_time}-{pattern.end_time}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 勤務可能曜日 */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />勤務可能曜日 <span className="text-red-500">*</span>
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {dayOptions.map((day) => (
                    <label key={day} className="flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 bg-white hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        checked={formData.available_days.includes(day)} 
                        onChange={() => updateCheckboxArray('available_days', day)} 
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="font-medium text-gray-800">{day}曜日</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600">
                    <strong>注意:</strong> 桐山は土曜勤務不可です。富沢は週26時間以内の制限があります。
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">キャンセル</button>
                <button type="button" onClick={saveEmployee} disabled={!formData.name || formData.available_days.length === 0} className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-300">{editingEmployee ? '更新' : '追加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;