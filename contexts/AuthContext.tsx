'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LoginCredentials, UserRole } from '@/types'
import {
  login as authLogin,
  logout as authLogout,
  verifySession,
  validateEmployeeNumber
} from '@/lib/auth-utils'
import { STORAGE_KEYS } from '@/lib/constants'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  needsPasswordChange: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkPasswordChangeRequired: () => Promise<boolean>
  updatePasswordChangeStatus: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// セッション管理のキー（統一された定数を使用）
const SESSION_KEY = STORAGE_KEYS.SESSION

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    initializeAuth()
  }, [])

  // 認証状態の初期化（セッション復元）
  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // ローカルストレージからセッショントークンを取得
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (!sessionToken) {
        setIsLoading(false)
        return
      }

      // セッショントークンを検証
      const userData = await verifySession(sessionToken)
      
      if (userData) {
        // ユーザー情報を設定（修正: employee_numberプロパティを追加）
        const userInfo: User = {
          id: userData.id.toString(),
          user_id: userData.employee_number,
          employee_number: userData.employee_number,  // 追加: employee_numberプロパティ
          name: userData.name,
          role: userData.role as UserRole,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }
        
        setUser(userInfo)
        
        // パスワード変更が必要かチェック
        const passwordChangeRequired = !userData.password_changed
        setNeedsPasswordChange(passwordChangeRequired)
        
        // 初回ログイン時はパスワード変更画面にリダイレクト
        if (passwordChangeRequired && window.location.pathname !== '/change-password') {
          router.push('/change-password')
        }
      } else {
        // セッションが無効な場合はクリア
        localStorage.removeItem(SESSION_KEY)
      }
    } catch (error) {
      console.error('認証初期化エラー:', error)
      localStorage.removeItem(SESSION_KEY)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      // 従業員番号の形式チェック
      if (!validateEmployeeNumber(credentials.user_id)) {
        throw new Error('従業員番号の形式が正しくありません（emp001形式で入力してください）')
      }

      // 独自認証システムでログイン
      const authResult = await authLogin(credentials.user_id, credentials.password)
      
      // セッショントークンをローカルストレージに保存
      if (authResult.session_token) {
        localStorage.setItem(SESSION_KEY, authResult.session_token)
      }

      // ユーザー情報を設定（修正: employee_numberプロパティを追加）
      const userInfo: User = {
        id: authResult.id.toString(),
        user_id: authResult.employee_number,
        employee_number: authResult.employee_number,  // 追加: employee_numberプロパティ
        name: authResult.name,
        role: authResult.role as UserRole,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }
      
      setUser(userInfo)

      // パスワード変更が必要かチェック
      const passwordChangeRequired = !authResult.password_changed
      setNeedsPasswordChange(passwordChangeRequired)

      // 初回ログイン時はパスワード変更画面にリダイレクト
      if (passwordChangeRequired) {
        router.push('/change-password')
      } else {
        router.push('/')
      }
      
    } catch (error: any) {
      console.error('ログインエラー:', error)
      
      // エラーメッセージを日本語化
      let errorMessage = 'ログインに失敗しました'
      
      if (error.message?.includes('従業員番号が見つかりません')) {
        errorMessage = '従業員番号が見つかりません'
      } else if (error.message?.includes('パスワードが間違っています')) {
        errorMessage = 'パスワードが間違っています'
      } else if (error.message?.includes('パスワードが設定されていません')) {
        errorMessage = 'アカウントが正しく設定されていません。管理者にお問い合わせください'
      } else if (error.message?.includes('従業員番号の形式')) {
        errorMessage = error.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      
      // セッショントークンを取得
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (sessionToken) {
        // サーバー側でセッションを無効化
        await authLogout(sessionToken)
      }
      
      // ローカルストレージをクリア
      localStorage.removeItem(SESSION_KEY)
      
      // ユーザー情報をクリア
      setUser(null)
      setNeedsPasswordChange(false)
      
      // ログインページにリダイレクト
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
      
      // エラーが発生してもローカル状態はクリア
      localStorage.removeItem(SESSION_KEY)
      setUser(null)
      setNeedsPasswordChange(false)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPasswordChangeRequired = async (): Promise<boolean> => {
    try {
      if (!user?.employee_number) return false

      // セッショントークンを再検証してパスワード変更状態を確認
      const sessionToken = localStorage.getItem(SESSION_KEY)
      
      if (!sessionToken) return false

      const userData = await verifySession(sessionToken)
      
      if (userData) {
        const required = !userData.password_changed
        setNeedsPasswordChange(required)
        return required
      }
      
      return false
    } catch (error) {
      console.error('パスワード変更状態確認エラー:', error)
      return false
    }
  }

  // パスワード変更完了後にフラグを更新
  const updatePasswordChangeStatus = () => {
    setNeedsPasswordChange(false)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    needsPasswordChange,
    login,
    logout,
    checkPasswordChangeRequired,
    updatePasswordChangeStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}