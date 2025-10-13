'use client'

import { useState, ReactNode } from 'react'

import { 
  Users, 
  Calendar, 
  Bot, 
  ClipboardList, 
  Rocket,
  Play,
  Clock
} from 'lucide-react'

interface ManagementCard {
  id: string
  icon: ReactNode
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
}

interface StatCard {
  icon: ReactNode
  title: string
  value: string | number
  color: string
}

interface DataInputPageProps {
  onNavigate?: (page: string) => void
}

export default function DataInputPage({ onNavigate }: DataInputPageProps) {
  const [targetMonth, setTargetMonth] = useState('2025-08')
  const [specialRequests, setSpecialRequests] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 管理機能カード（新要件に対応して削減）
  const managementCards: ManagementCard[] = [
    {
      id: 'employee',
      icon: <Users className="w-12 h-12" />,
      title: 'スタッフ管理',
      description: '4名のスタッフ情報、勤務制約、対応パターンを設定',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600'
    },
    {
      id: 'shift-pattern',
      icon: <Clock className="w-12 h-12" />,
      title: 'シフトパターン管理',
      description: '5つの勤務パターン（○▲◆記号）の確認・調整',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-600'
    },
    {
      id: 'leave',
      icon: <Calendar className="w-12 h-12" />,
      title: '希望休管理',
      description: 'スタッフの希望休申請・承認、×記号での表示',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600'
    },
    {
      id: 'constraints',
      icon: <Bot className="w-12 h-12" />,
      title: '基本制約管理',
      description: '労働基準法遵守、勤務時間制限等の基本ルール',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-orange-600'
    },
    {
      id: 'shift',
      icon: <ClipboardList className="w-12 h-12" />,
      title: 'シフト表示・編集',
      description: '記号形式（○▲◆×）でのシフト確認・手動調整',
      gradientFrom: 'from-indigo-500',
      gradientTo: 'to-indigo-600'
    }
  ]

  // 統計カード（新要件に対応）
  const statCards: StatCard[] = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'スタッフ数',
      value: '4名',
      color: 'text-blue-600'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: '今月の希望休',
      value: '3件',
      color: 'text-green-600'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'シフトパターン',
      value: '5種類',
      color: 'text-orange-600'
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: '基本制約ルール',
      value: '5件',
      color: 'text-purple-600'
    }
  ]

  const handleCardClick = (cardId: string) => {
    if (onNavigate) {
      onNavigate(cardId)
    } else {
      console.log(`Navigate to ${cardId}`)
      alert(`${cardId}ページに遷移します（実装予定）`)
    }
  }

  const handleGenerateShift = async () => {
    if (!targetMonth) {
      alert('対象月を選択してください')
      return
    }

    setIsGenerating(true)
    
    try {
      // AIシフト作成のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      alert(`${targetMonth}のシフトを作成しました！\n特別要望: ${specialRequests || 'なし'}`)
      
      // シフト表示ページに遷移
      if (onNavigate) {
        onNavigate('shift')
      }
      
    } catch (error) {
      alert('シフト作成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // 管理期間の説明
  const getCurrentPeriod = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    // 16日基準で期間を計算
    const currentDay = now.getDate()
    if (currentDay >= 16) {
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      return `${year}/${month}/16 - ${nextYear}/${nextMonth}/15`
    } else {
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      return `${prevYear}/${prevMonth}/16 - ${year}/${month}/15`
    }
  }

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Rocket className="w-8 h-8" />
          シフト作成ツール
        </h2>
        <p className="text-lg text-gray-600">
          4名スタッフの勤務管理・記号形式シフト作成
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-fit">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">現在の管理期間: {getCurrentPeriod()}</span>
        </div>
      </div>

      {/* AIシフト作成セクション */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
        <h3 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
          <Bot className="w-7 h-7" />
          AIシフト作成
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="target-month" className="block text-sm font-semibold text-gray-700 mb-2">
              対象月（16日〜翌月15日）
            </label>
            <input
              id="target-month"
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
            />
          </div>
          
          <div>
            <label htmlFor="special-requests" className="block text-sm font-semibold text-gray-700 mb-2">
              特別要望・調整事項
            </label>
            <input
              id="special-requests"
              type="text"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="例：月末は富沢の短時間勤務を増やす"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
            />
          </div>
        </div>

        {/* シフト作成条件の概要 */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-indigo-100">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            AI作成条件
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">スタッフ制約</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• 富沢: 週4日、月100h（▲◆短時間対応）</li>
                <li>• 田中: 週5日、月117h（フルタイム）</li>
                <li>• 桐山: 週4日、月100h（土曜不可）</li>
                <li>• ヘルプ: 記号表示のみ</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">基本ルール</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• 希望休（×）を最優先</li>
                <li>• 労働基準法遵守</li>
                <li>• 連続勤務日数制限</li>
                <li>• 月間労働時間上限管理</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleGenerateShift}
            disabled={isGenerating}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              isGenerating
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                作成中...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                AIシフト作成開始
              </>
            )}
          </button>
        </div>
      </div>

      {/* 管理機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementCards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left`}
          >
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-6 group-hover:skew-y-6 transition-transform duration-300" />
            
            <div className="relative z-10">
              <div className="mb-4">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                {card.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 記号説明カード */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
          シフト記号システム
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              ○
            </div>
            <div>
              <div className="font-semibold text-blue-800">通常勤務</div>
              <div className="text-xs text-blue-600">フルタイム勤務</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              ▲
            </div>
            <div>
              <div className="font-semibold text-green-800">午前短時間</div>
              <div className="text-xs text-green-600">富沢 9:00-13:00</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              ◆
            </div>
            <div>
              <div className="font-semibold text-purple-800">午後短時間</div>
              <div className="text-xs text-purple-600">富沢 14:00-18:00</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              ×
            </div>
            <div>
              <div className="font-semibold text-red-800">休み</div>
              <div className="text-xs text-red-600">希望休・有給等</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}