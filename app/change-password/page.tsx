'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Key, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { changePassword, validatePasswordStrength } from '@/lib/auth-utils'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, logout, updatePasswordChangeStatus } = useAuth()
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean
    errors: string[]
  }>({ isValid: false, errors: [] })

  // パスワード強度をリアルタイムチェック
  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, newPassword: value }))
    const strength = validatePasswordStrength(value)
    setPasswordStrength(strength)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください'
    } else if (!passwordStrength.isValid) {
      newErrors.newPassword = 'パスワードの要件を満たしていません'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認を入力してください'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // 修正: employeeNumberとnewPasswordの両方を渡す
      await changePassword(user?.employee_number!, formData.newPassword)
      
      // パスワード変更完了後にフラグを更新
      updatePasswordChangeStatus()
      
      // 成功メッセージ表示後にリダイレクト
      setTimeout(() => {
        router.push('/')
      }, 1000)
      
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'パスワード変更に失敗しました' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">パスワード変更</h1>
            <p className="text-gray-600 mt-2">
              初回ログインのため、パスワードを変更してください
            </p>
            <div className="mt-3 p-2 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">
                {/* 修正: user_idではなくemployee_numberを使用 */}
                ログイン中: {user?.name} ({user?.employee_number})
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 新しいパスワード */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                新しいパスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-200 transition-colors text-gray-900 placeholder:text-gray-400 ${
                    errors.newPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                  }`}
                  placeholder="新しいパスワードを入力"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
              
              {/* パスワード強度表示 */}
              {formData.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs">
                    {passwordStrength.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.isValid ? 'text-green-600' : 'text-red-600'}>
                      パスワード強度: {passwordStrength.isValid ? '良好' : '不十分'}
                    </span>
                  </div>
                  {passwordStrength.errors.length > 0 && (
                    <ul className="text-xs text-red-600 ml-5 space-y-1">
                      {passwordStrength.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード確認
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-200 transition-colors text-gray-900 placeholder:text-gray-400 ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                  }`}
                  placeholder="パスワードを再入力"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              
              {/* パスワード一致確認 */}
              {formData.confirmPassword && (
                <div className="mt-1 flex items-center text-xs">
                  {formData.newPassword === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600">パスワードが一致しています</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-600">パスワードが一致しません</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* エラーメッセージ */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* 成功メッセージ */}
            {isLoading && !errors.submit && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">パスワードを変更中...</p>
              </div>
            )}

            {/* パスワード変更ボタン */}
            <button
              type="submit"
              disabled={isLoading || !passwordStrength.isValid || formData.newPassword !== formData.confirmPassword}
              className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isLoading || !passwordStrength.isValid || formData.newPassword !== formData.confirmPassword
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? 'パスワード変更中...' : 'パスワードを変更'}
            </button>
          </form>

          {/* ログアウトボタン */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              ログアウト
            </button>
          </div>

          {/* パスワード要件説明 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">パスワード要件:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 6文字以上</li>
              <li>• 英字を含む</li>
              <li>• 数字を含む</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}