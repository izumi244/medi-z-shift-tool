'use client';

import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, Edit3, Download, ClipboardList, X, Save, AlertCircle, Clock, User } from 'lucide-react';

// --- 新要件対応の型定義 ---
type ShiftSymbol = '○' | '▲' | '◆' | '×' | '';

interface ShiftAssignment {
  symbol: ShiftSymbol;
  patternId?: string;
  reason?: string; // 休みの理由等
}

interface Employee {
  id: string;
  name: string;
  type: string;
  maxDaysPerWeek: number;
  maxHoursPerMonth: number;
  maxHoursPerWeek?: number;
  availablePatterns: string[];
  canWorkSaturday: boolean;
}

interface ShiftData {
  [employeeId: string]: {
    [day: number]: ShiftAssignment;
  };
}

interface ShiftPattern {
  id: string;
  name: string;
  symbol: ShiftSymbol;
  startTime: string;
  endTime: string;
  workingHours: number;
  applicableStaff: string[];
  color: string;
}

// --- メインコンポーネント ---
const ShiftPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // 2025年8月
  const [editMode, setEditMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{employeeId: string, day: number, employeeName: string} | null>(null);
  
  const [editValues, setEditValues] = useState({
    symbol: '○' as ShiftSymbol,
    reason: ''
  });

  // --- 固定データ：4名のスタッフ ---
  const employees: Employee[] = [
    {
      id: '1',
      name: '富沢',
      type: '週4日・月100h（短時間対応）',
      maxDaysPerWeek: 4,
      maxHoursPerMonth: 100,
      maxHoursPerWeek: 26,
      availablePatterns: ['1', '2', '3', '4'],
      canWorkSaturday: true
    },
    {
      id: '2',
      name: '田中',
      type: '週5日・月117h（フルタイム）',
      maxDaysPerWeek: 5,
      maxHoursPerMonth: 117,
      availablePatterns: ['1', '2'],
      canWorkSaturday: true
    },
    {
      id: '3',
      name: '桐山',
      type: '週4日・月100h（土曜不可）',
      maxDaysPerWeek: 4,
      maxHoursPerMonth: 100,
      availablePatterns: ['5'],
      canWorkSaturday: false
    },
    {
      id: '4',
      name: 'ヘルプ',
      type: '表示のみ（シフト組み込み対象外）',
      maxDaysPerWeek: 0,
      maxHoursPerMonth: 0,
      availablePatterns: [],
      canWorkSaturday: true
    }
  ];

  // --- 固定データ：5つのシフトパターン ---
  const shiftPatterns: ShiftPattern[] = [
    {
      id: '1',
      name: 'フルタイム平日',
      symbol: '○',
      startTime: '09:00',
      endTime: '18:00',
      workingHours: 8,
      applicableStaff: ['富沢', '田中'],
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: '土曜勤務',
      symbol: '○',
      startTime: '09:00',
      endTime: '16:00',
      workingHours: 6,
      applicableStaff: ['富沢', '田中'],
      color: 'bg-blue-400'
    },
    {
      id: '3',
      name: '富沢午前短時間',
      symbol: '▲',
      startTime: '09:00',
      endTime: '13:00',
      workingHours: 4,
      applicableStaff: ['富沢'],
      color: 'bg-green-500'
    },
    {
      id: '4',
      name: '富沢午後短時間',
      symbol: '◆',
      startTime: '14:00',
      endTime: '18:00',
      workingHours: 4,
      applicableStaff: ['富沢'],
      color: 'bg-purple-500'
    },
    {
      id: '5',
      name: '桐山専用',
      symbol: '○',
      startTime: '09:00',
      endTime: '17:00',
      workingHours: 7,
      applicableStaff: ['桐山'],
      color: 'bg-orange-500'
    }
  ];

  // --- サンプルシフトデータ ---
  const [shiftData, setShiftData] = useState<ShiftData>({
    '1': { // 富沢
      1: { symbol: '○', patternId: '1' },
      2: { symbol: '▲', patternId: '3' },
      3: { symbol: '×', reason: '希望休' },
      5: { symbol: '◆', patternId: '4' },
      8: { symbol: '○', patternId: '2' }, // 土曜
      12: { symbol: '▲', patternId: '3' },
      15: { symbol: '×', reason: '有給' },
      19: { symbol: '○', patternId: '1' },
      22: { symbol: '○', patternId: '2' } // 土曜
    },
    '2': { // 田中
      1: { symbol: '○', patternId: '1' },
      2: { symbol: '○', patternId: '1' },
      4: { symbol: '○', patternId: '1' },
      5: { symbol: '○', patternId: '1' },
      6: { symbol: '○', patternId: '1' },
      8: { symbol: '○', patternId: '2' }, // 土曜
      11: { symbol: '○', patternId: '1' },
      12: { symbol: '○', patternId: '1' },
      13: { symbol: '○', patternId: '1' },
      14: { symbol: '○', patternId: '1' },
      16: { symbol: '×', reason: '有給' },
      18: { symbol: '○', patternId: '1' },
      19: { symbol: '○', patternId: '1' },
      20: { symbol: '○', patternId: '1' }
    },
    '3': { // 桐山
      1: { symbol: '○', patternId: '5' },
      2: { symbol: '○', patternId: '5' },
      4: { symbol: '○', patternId: '5' },
      6: { symbol: '○', patternId: '5' },
      11: { symbol: '○', patternId: '5' },
      13: { symbol: '○', patternId: '5' },
      14: { symbol: '○', patternId: '5' },
      18: { symbol: '○', patternId: '5' },
      20: { symbol: '×', reason: '希望休' },
      25: { symbol: '○', patternId: '5' },
      27: { symbol: '○', patternId: '5' }
    },
    '4': { // ヘルプ
      3: { symbol: '×', reason: '休み' },
      10: { symbol: '×', reason: '休み' },
      17: { symbol: '×', reason: '休み' },
      24: { symbol: '×', reason: '休み' },
      31: { symbol: '×', reason: '休み' }
    }
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // カレンダー日付生成
  const generateDays = () => {
    const daysArray = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.toLocaleDateString('ja-JP', { weekday: 'short' });
      daysArray.push({ 
        day, 
        dayOfWeek, 
        isSaturday: dayOfWeek === '土', 
        isSunday: dayOfWeek === '日' 
      });
    }
    return daysArray;
  };
  const days = generateDays();

  // セルクリック時の編集モーダル表示
  const handleCellClick = (employeeId: string, day: number, employeeName: string) => {
    if (!editMode) return;

    const employee = employees.find(e => e.id === employeeId);
    const dayInfo = days[day - 1];

    // ヘルプスタッフのシフト組み込み制限
    if (employeeName === 'ヘルプ') {
      alert('ヘルプスタッフはシフト組み込み対象外です。×記号での表示のみ可能です。');
      return;
    }

    // 桐山の土曜勤務制限チェック
    if (employeeName === '桐山' && dayInfo?.isSaturday) {
      alert('桐山は土曜勤務不可です。');
      return;
    }
    
    const shift = shiftData[employeeId]?.[day];
    setEditingCell({employeeId, day, employeeName});

    setEditValues({
      symbol: shift?.symbol || '○',
      reason: shift?.reason || ''
    });
    setIsEditModalOpen(true);
  };

  // 編集内容保存
  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { employeeId, day } = editingCell;

    const newShift: ShiftAssignment = {
      symbol: editValues.symbol,
      reason: editValues.symbol === '×' ? editValues.reason : undefined,
      patternId: getPatternIdFromSymbol(editValues.symbol, employeeId)
    };

    setShiftData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [day]: newShift
      }
    }));
    
    handleCloseModal();
  };

  // 記号からパターンIDを取得
  const getPatternIdFromSymbol = (symbol: ShiftSymbol, employeeId: string): string | undefined => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || symbol === '×') return undefined;

    if (symbol === '▲') return '3'; // 富沢午前短時間
    if (symbol === '◆') return '4'; // 富沢午後短時間
    if (symbol === '○') {
      if (employee.name === '桐山') return '5';
      // その他は基本的にフルタイム（土曜判定は省略）
      return '1';
    }
    return undefined;
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingCell(null);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  // セル表示用のコンポーネント
  const renderShiftCell = (employee: Employee, day: number, dayInfo: { isSunday: boolean, isSaturday: boolean }) => {
    const shift = shiftData[employee.id]?.[day];
    const cellClass = `border-r border-gray-200 h-16 p-1 align-middle text-center ${
      dayInfo.isSunday ? 'bg-pink-50' : dayInfo.isSaturday ? 'bg-blue-50' : 'bg-white'
    } ${editMode ? 'cursor-pointer hover:bg-yellow-100' : ''} transition-colors`;

    if (!shift || !shift.symbol) {
      return <td key={day} className={cellClass} onClick={() => handleCellClick(employee.id, day, employee.name)} />;
    }

    // 記号の色分け
    const getSymbolColor = (symbol: ShiftSymbol) => {
      switch (symbol) {
        case '○': return 'text-blue-600 bg-blue-100';
        case '▲': return 'text-green-600 bg-green-100';
        case '◆': return 'text-purple-600 bg-purple-100';
        case '×': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    const pattern = shiftPatterns.find(p => p.id === shift.patternId);
    const timeInfo = pattern ? `${pattern.startTime}-${pattern.endTime}` : shift.reason || '';

    return (
      <td key={day} className={cellClass} onClick={() => handleCellClick(employee.id, day, employee.name)}>
        <div className="h-full flex flex-col items-center justify-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${getSymbolColor(shift.symbol)}`}>
            {shift.symbol}
          </div>
          {timeInfo && (
            <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
              {timeInfo}
            </div>
          )}
        </div>
      </td>
    );
  };

  // 労働時間統計計算
  const calculateMonthlyStats = (employeeId: string) => {
    const shifts = shiftData[employeeId] || {};
    let totalDays = 0;
    let totalHours = 0;

    Object.values(shifts).forEach(shift => {
      if (shift.symbol !== '×' && shift.patternId) {
        const pattern = shiftPatterns.find(p => p.id === shift.patternId);
        if (pattern) {
          totalDays++;
          totalHours += pattern.workingHours;
        }
      }
    });

    return { totalDays, totalHours };
  };

  return (
    <div className="space-y-6">
      <div className="pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <ClipboardList className="w-8 h-8" />
          シフト表示・編集
        </h2>
        <p className="text-lg text-gray-600">記号形式（○▲◆×）でのシフト確認・手動調整</p>
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

        {/* 記号説明 */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">○</div>
            <span className="text-blue-800 font-medium">通常勤務</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">▲</div>
            <span className="text-green-800 font-medium">富沢午前</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">◆</div>
            <span className="text-purple-800 font-medium">富沢午後</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">×</div>
            <span className="text-red-800 font-medium">休み</span>
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
                {days.map(({ day, dayOfWeek, isSaturday, isSunday }) => (
                  <th key={day} className={`p-2 text-center font-medium text-gray-700 text-xs w-16 border-r border-gray-200 ${
                    isSunday ? 'bg-pink-50' : isSaturday ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div>{day}</div>
                    <div className="text-xs opacity-70">({dayOfWeek})</div>
                  </th>
                ))}
                <th className="w-24 p-3 text-sm font-bold text-gray-700 bg-gray-50">統計</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const stats = calculateMonthlyStats(employee.id);
                return (
                  <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="border-r border-gray-200 p-3 bg-gray-50 sticky left-0 z-10">
                      <div className="text-sm font-bold text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-600 leading-tight">{employee.type}</div>
                    </td>
                    {days.map(({ day, isSunday, isSaturday }) => 
                      renderShiftCell(employee, day, { isSunday, isSaturday })
                    )}
                    <td className="p-2 text-xs text-center bg-gray-50">
                      <div className="text-blue-600 font-bold">{stats.totalDays}日</div>
                      <div className="text-orange-600 font-bold">{stats.totalHours}h</div>
                      <div className="text-gray-500 text-xs">
                        {employee.maxHoursPerMonth > 0 && `/${employee.maxHoursPerMonth}h`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && editingCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-indigo-600">シフト編集</h3>
                <p className="text-gray-600">{editingCell.employeeName} - {month + 1}月{editingCell.day}日</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <div id="symbol-label" className="block text-sm font-semibold text-gray-700 mb-3">記号選択</div>
                <div role="group" aria-labelledby="symbol-label" className="grid grid-cols-2 gap-3">
                  {['○', '▲', '◆', '×'].map((symbol) => {
                    const employee = employees.find(e => e.id === editingCell.employeeId);
                    const isDisabled = (
                      (symbol === '▲' || symbol === '◆') && employee?.name !== '富沢'
                    );

                    return (
                      <button
                        key={symbol}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setEditValues(prev => ({ ...prev, symbol: symbol as ShiftSymbol }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          editValues.symbol === symbol
                            ? 'border-indigo-500 bg-indigo-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl font-bold mb-1">{symbol}</div>
                        <div className="text-xs text-gray-600">
                          {symbol === '○' && '通常勤務'}
                          {symbol === '▲' && '午前短時間'}
                          {symbol === '◆' && '午後短時間'}
                          {symbol === '×' && '休み'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {editValues.symbol === '×' && (
                <div>
                  <label htmlFor="reason-select" className="block text-sm font-semibold text-gray-700 mb-2">休みの理由</label>
                  <select
                    id="reason-select"
                    value={editValues.reason}
                    onChange={(e) => setEditValues(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftPage;