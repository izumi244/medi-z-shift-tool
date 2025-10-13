'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Eye, EyeOff, Lock, User } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { validateUserId, validatePassword } from '@/lib/auth'
import { LoginCredentials } from '@/types'

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState<LoginCredentials>({
    user_id: '',
    password: '',
    remember_me: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.user_id) {
      newErrors.user_id = 'ユーザーIDを入力してください'
    } else if (!validateUserId(formData.user_id)) {
      newErrors.user_id = 'ユーザーIDは小文字5文字+数字3桁で入力してください'
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'パスワードは小文字5文字+数字3桁で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await login(formData)
      router.push('/') // シフト作成ページにリダイレクト
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'ログインに失敗しました' })
    } finally {
      setIsLoading(false)
    }
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
            <p className="text-gray-600 mt-2">ログインしてください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザーID */}
            <div>
              <label htmlFor="user-id" className="block text-sm font-semibold text-gray-700 mb-2">
                ユーザーID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="user-id"
                  type="text"
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value.toLowerCase() }))}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-200 transition-colors ${
                    errors.user_id ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                  }`}
                  placeholder="例: admin123"
                  maxLength={8}
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
                  maxLength={8}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                type="checkbox"
                id="remember_me"
                checked={formData.remember_me}
                onChange={(e) => setFormData(prev => ({ ...prev, remember_me: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={isLoading}
              />
              <label htmlFor="remember_me" className="ml-2 text-sm text-gray-700">
                ログイン状態を保持する（2週間）
              </label>
            </div>

            {/* エラーメッセージ */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isLoading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* デモユーザー情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">デモ用ログイン情報:</p>
            <div className="text-xs space-y-1">
              <div>管理者: admin123 / admin123</div>
              <div>従業員: nurse456 / nurse456</div>
              <div>開発者: devel789 / devel789</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}