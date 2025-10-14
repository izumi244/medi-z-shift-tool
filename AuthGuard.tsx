'use client'

import { useEffect } from 'react'

import { useRouter, usePathname } from 'next/navigation'

import { useAuth } from '@/contexts/AuthContext'

// 従業員がアクセスできないページ
const EMPLOYEE_RESTRICTED_PAGES = [
  '/employee',      // 従業員管理
  '/shiftPattern',  // シフトパターン管理
  '/constraints'    // 制約条件管理
]

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      // 未認証の場合、ログインページにリダイレクト
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login')
        return
      }

      // 認証済みでログインページにいる場合、ホームページにリダイレクト
      if (isAuthenticated && pathname === '/login') {
        router.push('/')
        return
      }

      // 従業員の権限チェック
      if (user?.role === 'employee' && EMPLOYEE_RESTRICTED_PAGES.includes(pathname)) {
        router.push('/') // シフト作成ページにリダイレクト
        return
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router])

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証でログインページ以外にアクセスしようとした場合
  if (!isAuthenticated && pathname !== '/login') {
    return null
  }

  return <>{children}</>
}