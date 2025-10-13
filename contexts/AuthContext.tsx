'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LoginCredentials, UserRole } from '@/types'
import { validateCredentials } from '@/lib/auth'
import { getSession, saveSession, createSession, clearSession } from '@/lib/session'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const session = await getSession()
      if (session && session.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      const user = await validateCredentials(credentials)
      
      if (!user) {
        throw new Error('ユーザーIDまたはパスワードが間違っています')
      }

      // セッション作成
      const session = await createSession(user, credentials.remember_me)
      await saveSession(session)
      
      setUser(user)
      router.push('/')
      
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await clearSession()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
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