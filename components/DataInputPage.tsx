'use client'

import { useState, ReactNode } from 'react'
import { useShiftData } from '@/contexts/ShiftDataContext'
import { useNonSystemEmployees } from '@/hooks/useNonSystemEmployees'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentYearMonth } from '@/utils/dateFormat'
import { authenticatedPost } from '@/lib/api-client'

import {
  Users,
  Calendar,
  Bot,
  ClipboardList,
  Rocket,
  Play,
  Clock,
  Lock
} from 'lucide-react'

interface ManagementCard {
  id: string
  icon: ReactNode
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
}

interface DataInputPageProps {
  onNavigate?: (page: string, month?: string) => void
}

export default function DataInputPage({ onNavigate }: DataInputPageProps) {
  const { employees, leaveRequests, shiftPatterns, constraints, saveGeneratedShifts } = useShiftData()
  const { user } = useAuth()

  // システムアカウントを除外
  const actualEmployees = useNonSystemEmployees(employees)

  const [targetMonth, setTargetMonth] = useState(getCurrentYearMonth())
  const [specialRequests, setSpecialRequests] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 管理者または開発者かどうかを判定
  const isAdminOrDeveloper = user?.role === 'admin' || user?.role === 'developer'

  // 管理機能カード（新要件に対応して削減）
  const managementCards: ManagementCard[] = [
    {
      id: 'employee',
      icon: <Users className="w-12 h-12" />,
      title: '従業員管理',
      description: '従業員情報、勤務制約、対応パターンを設定',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600'
    },
    {
      id: 'shift-pattern',
      icon: <Clock className="w-12 h-12" />,
      title: 'シフトパターン管理',
      description: '勤務パターンの設定',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-600'
    },
    {
      id: 'leave',
      icon: <Calendar className="w-12 h-12" />,
      title: '希望休管理',
      description: 'スタッフの希望休申請・承認・編集機能',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600'
    },
    {
      id: 'constraints',
      icon: <Bot className="w-12 h-12" />,
      title: 'AI制約条件管理',
      description: '自然言語での制約方針設定',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-orange-600'
    },
    {
      id: 'shift',
      icon: <ClipboardList className="w-12 h-12" />,
      title: 'シフト表示',
      description: '作成されたシフトの確認・編集',
      gradientFrom: 'from-indigo-500',
      gradientTo: 'to-indigo-600'
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
      // Dify Workflow APIを呼び出してシフトを生成
      // システムアカウントは既に除外済み（actualEmployees）

      console.log('全従業員数:', employees.length)
      console.log('シフト対象従業員数:', actualEmployees.length)
      console.log('シフト対象:', actualEmployees.map(e => e.name))

      // 従業員とシフトパターンに連番IDを追加（Difyが参照しやすいように）
      const employeesWithIndex = actualEmployees.map((emp, index) => ({
        ...emp,
        index_id: index + 1,
        uuid: emp.id
      }))

      const shiftPatternsWithIndex = shiftPatterns.map((pattern, index) => ({
        ...pattern,
        index_id: index + 1,
        uuid: pattern.id
      }))

      // アクティブな制約条件を取得してフォーマット
      const activeConstraints = constraints
        .filter(c => c.is_active)
        .map(c => `- ${c.name}: ${c.description}`)
        .join('\n')

      const allConstraints = [
        activeConstraints,
        specialRequests ? `\n【特別要望】\n${specialRequests}` : ''
      ].filter(Boolean).join('\n') || '特になし'

      console.log('送信する制約条件:\n', allConstraints)
      console.log('対象月:', targetMonth)

      const requestBody = {
        target_month: targetMonth,
        employees: employeesWithIndex,
        leave_requests: leaveRequests,
        shift_patterns: shiftPatternsWithIndex,
        constraints: allConstraints,
      }

      console.log('APIリクエストボディ:', requestBody)

      // 認証付きAPIリクエスト
      const result = await authenticatedPost('/api/generate-shift', requestBody)

      console.log('APIレスポンス:', result)
      console.log('result.success:', result.success)
      console.log('result.data:', result.data)
      console.log('result.data.shifts:', result.data?.shifts)
      console.log('shifts length:', result.data?.shifts?.length)
      console.log('DEBUG情報:', result.debug)

      if (result.success && result.data.shifts && result.data.shifts.length > 0) {
        // Supabaseにシフトを保存
        await saveGeneratedShifts(result.data.shifts)

        alert(`${targetMonth}のシフトを作成しました！\n生成されたシフト数: ${result.data.shifts.length}`)

        // シフト表示ページに遷移（対象月を渡す）
        if (onNavigate) {
          onNavigate('shift', targetMonth)
        }
      } else {
        console.error('シフト生成失敗の詳細:', {
          success: result.success,
          shiftsCount: result.data?.shifts?.length,
          debug: result.debug,
          fullResult: result
        })
        throw new Error(`シフト生成に失敗しました。生成されたシフト数: ${result.data?.shifts?.length || 0}`)
      }

    } catch (error) {
      console.error('Shift generation error:', error)
      alert(`シフト作成中にエラーが発生しました\n${error instanceof Error ? error.message : ''}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-4 md:pb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-2 md:gap-3">
          <Rocket className="w-6 h-6 md:w-8 md:h-8" />
          シフト作成
        </h2>
        <p className="text-sm md:text-lg text-gray-600">
          管理機能へのアクセスとシフト作成
        </p>
      </div>

      {/* AIシフト作成セクション */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 md:p-8 border border-indigo-200">
        <h3 className="text-xl md:text-2xl font-bold text-indigo-700 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
          <Bot className="w-6 h-6 md:w-7 md:h-7" />
          AIシフト作成
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="target-month" className="block text-sm font-semibold text-gray-700 mb-2">
              対象月
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
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
            />
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleGenerateShift}
            disabled={isGenerating || !isAdminOrDeveloper}
            className={`inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 ${
              isGenerating || !isAdminOrDeveloper
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white" />
                作成中...
              </>
            ) : !isAdminOrDeveloper ? (
              <>
                <Lock className="w-5 h-5 md:w-6 md:h-6" />
                管理者・開発者のみ実行可能
              </>
            ) : (
              <>
                <Play className="w-5 h-5 md:w-6 md:h-6" />
                AIシフト作成開始
              </>
            )}
          </button>
        </div>
      </div>

      {/* 管理機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {managementCards.map((card) => (
          <button
            key={card.id}
            onClick={() => isAdminOrDeveloper && handleCardClick(card.id)}
            disabled={!isAdminOrDeveloper}
            className={`group relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} text-white shadow-xl transition-all duration-300 text-left ${
              isAdminOrDeveloper
                ? 'hover:shadow-2xl transform hover:scale-105 cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {/* 背景装飾 */}
            <div className={`absolute inset-0 bg-white opacity-10 transform -skew-y-6 transition-transform duration-300 ${
              isAdminOrDeveloper ? 'group-hover:skew-y-6' : ''
            }`} />

            {/* ロックアイコン（従業員の場合） */}
            {!isAdminOrDeveloper && (
              <div className="absolute top-4 right-4 z-20">
                <Lock className="w-6 h-6" />
              </div>
            )}

            <div className="relative z-10">
              <div className="mb-3 md:mb-4">
                {card.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{card.title}</h3>
              <p className="text-xs md:text-sm opacity-90 leading-relaxed">
                {card.description}
              </p>
              {!isAdminOrDeveloper && (
                <p className="text-xs mt-2 opacity-80 font-semibold">
                  🔒 管理者・開発者のみアクセス可能
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}