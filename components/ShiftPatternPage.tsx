'use client';

import React from 'react';

import { Clock, Users } from 'lucide-react';

import type { ShiftPattern } from '@/types';

const ShiftPatternPage: React.FC = () => {
  // 5つの固定パターン
  const patterns: ShiftPattern[] = [
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

  // 実労働時間を計算
  const calculateWorkingHours = (pattern: ShiftPattern): number => {
    const startHour = parseInt(pattern.start_time.split(':')[0]);
    const startMinute = parseInt(pattern.start_time.split(':')[1]);
    const endHour = parseInt(pattern.end_time.split(':')[0]);
    const endMinute = parseInt(pattern.end_time.split(':')[1]);
    
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute) - pattern.break_minutes;
    return totalMinutes / 60;
  };

  // 記号の背景色を取得
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
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8" />
          シフトパターン管理
        </h2>
        <p className="text-lg text-gray-600">
          固定の勤務パターン一覧（編集不可）
        </p>
      </div>

      {/* パターン一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patterns.map(pattern => (
          <div key={pattern.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{pattern.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{pattern.start_time} ~ {pattern.end_time}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    実労働時間: {calculateWorkingHours(pattern)}時間
                    {pattern.break_minutes > 0 && `（休憩${pattern.break_minutes}分）`}
                  </div>
                </div>
                
                {/* 記号表示 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getSymbolColor(pattern.symbol)}`}>
                  {pattern.symbol}
                </div>
              </div>

              {/* 適用可能スタッフ */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">適用可能スタッフ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pattern.applicable_staff?.map((staff, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                    >
                      {staff}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* パターン詳細 */}
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">開始:</span> {pattern.start_time}
                </div>
                <div>
                  <span className="font-medium">終了:</span> {pattern.end_time}
                </div>
                <div>
                  <span className="font-medium">記号:</span> {pattern.symbol}
                </div>
                <div>
                  <span className="font-medium">ID:</span> {pattern.id}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">パターン説明</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">○</span>
            <span>通常勤務（フルタイム・土曜・桐山専用）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">▲</span>
            <span>富沢午前短時間勤務（9:00-13:00）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">◆</span>
            <span>富沢午後短時間勤務（14:00-18:00）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">×</span>
            <span>休み（希望休管理で設定）</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600">
            <strong>注意:</strong> これらのパターンは固定設定のため編集できません。
            スタッフ別の適用可能パターンは従業員管理画面で設定できます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftPatternPage;