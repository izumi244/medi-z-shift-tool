'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/types'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

interface FormErrors {
  user_id?: string
  password?: string
  general?: string
}

export default function LoginForm() {
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState<LoginCredentials>({
    user_id: '',
    password: '',
    remember_me: false
  })

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // 従業員番号チェック（emp001形式）
    if (!formData.user_id.trim()) {
      newErrors.user_id = '従業員番号を入力してください'
    } else if (!/^emp[0-9]{3}$/.test(formData.user_id)) {
      newErrors.user_id = '従業員番号はemp001形式で入力してください'
    }

    // パスワードチェック
    if (!formData.password.trim()) {
      newErrors.password = 'パスワードを入力してください'
    } else if (formData.password.length < 3) {
      newErrors.password = 'パスワードは3文字以上で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ログイン処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setErrors({})
      await login(formData)
    } catch (error: any) {
      console.error('ログインエラー:', error)
      setErrors({ 
        general: error.message || 'ログインに失敗しました' 
      })
    }
  }

  // デモユーザーでのクイックログイン
  const quickLogin = (employeeNumber: string, password: string) => {
    setFormData(prev => ({
      ...prev,
      user_id: employeeNumber,
      password: password
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">シフト管理システム</h1>
            <p className="text-gray-600 mt-2">従業員番号でログインしてください</p>
          </div>

          {/* エラーメッセージ表示 */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 従業員番号 */}
            <div>
              <label htmlFor="employee-number" className="block text-sm font-semibold text-gray-700 mb-2">
                従業員番号
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="employee-number"
                  type="text"
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value.toLowerCase() }))}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 transition-colors ${
                    errors.user_id ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                  }`}
                  placeholder="例: emp001"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
              {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>}
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 transition-colors ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                  }`}
                  placeholder="パスワードを入力"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* ログイン状態を保持 */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.remember_me}
                onChange={(e) => setFormData(prev => ({ ...prev, remember_me: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                ログイン状態を保持する
              </label>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* クイックログイン（開発用） */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-3 font-semibold">クイックログイン:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickLogin('emp001', 'dev123')}
                className="w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                disabled={isLoading}
              >
                <div className="font-semibold text-blue-800">🔧 開発者</div>
                <div className="text-blue-600">emp001 / dev123</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('emp002', 'admin123')}
                className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                disabled={isLoading}
              >
                <div className="font-semibold text-green-800">👑 管理者</div>
                <div className="text-green-600">emp002 / admin123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}