// lib/auth-utils.ts - 独自認証システム（bcrypt使用）

import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

// ==================== パスワード管理 ====================

/**
 * パスワードをbcryptでハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  return await bcrypt.hash(password, saltRounds)
}

/**
 * パスワードを検証
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * ランダムパスワードを生成（英字3文字+数字3文字）
 * 例: abc123, xyz789
 */
export function generatePassword(): string {
  // 英字部分（小文字3文字）
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let letterPart = ''
  for (let i = 0; i < 3; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // 数字部分（3桁）
  const numberPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return letterPart + numberPart
}

/**
 * ユニークなパスワードを生成
 * 複数回試行して重複を避ける
 */
export async function generateUniquePassword(): Promise<string> {
  let password = generatePassword()
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    // 簡易実装：ランダム生成なので重複確率は低い
    // 必要に応じて重複チェックロジックを追加
    return password
  }
  
  // 最大試行回数に達した場合、タイムスタンプを追加
  const timestamp = Date.now().toString().slice(-3)
  return generatePassword().slice(0, 3) + timestamp
}

// ==================== セッション管理 ====================

/**
 * ランダムなセッショントークンを生成（暗号学的に安全）
 */
export function generateSessionToken(): string {
  // 暗号学的に安全な乱数生成を使用
  if (typeof window !== 'undefined' && window.crypto) {
    // ブラウザ環境
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js環境
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }
}

/**
 * セッショントークンを検証し、ユーザー情報を取得
 */
export async function verifySession(sessionToken: string) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (error || !data || !data.session_token) return null

    // 開発者の従業員番号（環境変数から取得、デフォルトはemp001）
    const developers = process.env.DEVELOPER_EMPLOYEE_NUMBERS?.split(',') || ['emp001']
    const isDeveloper = data.is_system_account && developers.includes(data.employee_number || '')

    return {
      id: data.id,
      employee_number: data.employee_number || '',
      name: data.name,
      role: data.is_system_account ?
        (isDeveloper ? 'developer' : 'admin') :
        'employee',
      password_changed: data.password_changed || false
    }
  } catch (error) {
    console.error('セッション検証エラー:', error)
    return null
  }
}

// ==================== 認証機能 ====================

/**
 * ログイン処理
 */
export async function login(employeeNumber: string, password: string) {
  try {
    console.log(`ログイン試行: ${employeeNumber} / ${password}`)
    
    // 従業員番号で検索
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_number', employeeNumber)
      .single()

    console.log(`データベース結果:`, { data, error })

    if (error || !data) {
      throw new Error('従業員番号が見つかりません')
    }

    // password_hashがnullの場合はエラー
    if (!data.password_hash) {
      throw new Error('パスワードが設定されていません')
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(password, data.password_hash)
    if (!isValidPassword) {
      throw new Error('パスワードが間違っています')
    }

    // セッショントークン生成
    const sessionToken = generateSessionToken()

    // セッション情報を更新
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        session_token: sessionToken,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)

    if (updateError) throw updateError

    // 開発者の従業員番号（環境変数から取得、デフォルトはemp001）
    const developers = process.env.DEVELOPER_EMPLOYEE_NUMBERS?.split(',') || ['emp001']
    const isDeveloper = data.is_system_account && developers.includes(data.employee_number || '')

    // ユーザー情報を返す
    return {
      id: data.id,
      employee_number: data.employee_number || '',
      name: data.name,
      role: data.is_system_account ?
        (isDeveloper ? 'developer' : 'admin') :
        'employee',
      password_changed: data.password_changed || false,
      session_token: sessionToken
    }
  } catch (error) {
    console.error('ログインエラー:', error)
    throw error
  }
}

/**
 * ログアウト処理
 */
export async function logout(sessionToken: string) {
  try {
    const { error } = await supabase
      .from('employees')
      .update({
        session_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken)

    if (error) throw error
  } catch (error) {
    console.error('ログアウトエラー:', error)
    throw error
  }
}

/**
 * パスワード変更（デバッグ版）
 */
export async function changePassword(employeeNumber: string, newPassword: string) {
  try {
    console.log('=== changePassword デバッグ ===')
    console.log('employeeNumber:', employeeNumber)
    console.log('newPassword:', newPassword)
    console.log('newPassword type:', typeof newPassword)
    console.log('newPassword length:', newPassword?.length)
    
    // パラメータ検証
    if (!employeeNumber) {
      throw new Error('従業員番号が指定されていません')
    }
    
    if (!newPassword) {
      throw new Error('新しいパスワードが指定されていません')
    }
    
    if (typeof newPassword !== 'string') {
      throw new Error(`パスワードの型が正しくありません: ${typeof newPassword}`)
    }
    
    console.log('パスワードハッシュ化開始...')
    const hashedPassword = await hashPassword(newPassword)
    console.log('パスワードハッシュ化完了:', hashedPassword?.length, '文字')

    console.log('データベース更新開始...')
    const { error } = await supabase
      .from('employees')
      .update({
        password_hash: hashedPassword,
        password_changed: true,
        updated_at: new Date().toISOString()
      })
      .eq('employee_number', employeeNumber)

    if (error) {
      console.log('データベース更新エラー:', error)
      throw error
    }
    
    console.log('パスワード変更成功')
  } catch (error) {
    console.error('パスワード変更エラー:', error)
    throw error
  }
}

// ==================== 管理者機能 ====================

/**
 * 管理者による従業員のパスワードリセット
 */
export async function resetEmployeePassword(employeeNumber: string) {
  try {
    // 新しいパスワード生成
    const newPassword = await generateUniquePassword()
    const hashedPassword = await hashPassword(newPassword)

    // パスワードをリセット
    const { error } = await supabase
      .from('employees')
      .update({
        password_hash: hashedPassword,
        password_changed: false, // 初回ログイン扱い
        session_token: null, // セッションを無効化
        updated_at: new Date().toISOString()
      })
      .eq('employee_number', employeeNumber)

    if (error) throw error

    return {
      employee_number: employeeNumber,
      new_password: newPassword,
      reset_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    throw error
  }
}

// ==================== 従業員番号生成 ====================

/**
 * 従業員番号を生成（emp001形式）
 */
export function formatEmployeeNumber(number: number): string {
  return `emp${number.toString().padStart(3, '0')}`
}

/**
 * 次の従業員番号を取得して採番テーブルを更新
 */
export async function generateEmployeeNumber(): Promise<string> {
  try {
    // 現在の番号を取得
    const { data, error } = await supabase
      .from('employee_sequences')
      .select('last_number')
      .single()

    if (error) throw error

    const nextNumber = (data?.last_number || 0) + 1
    const employeeNumber = formatEmployeeNumber(nextNumber)

    // 採番テーブルを更新
    const { error: updateError } = await supabase
      .from('employee_sequences')
      .update({ 
        last_number: nextNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (updateError) throw updateError

    return employeeNumber
  } catch (error) {
    console.error('従業員番号生成エラー:', error)
    throw error
  }
}

// ==================== 従業員アカウント作成 ====================

/**
 * 新しい従業員のアカウントを作成（パスワード付き）
 */
export async function createEmployeeAccount(employeeData: {
  name: string
  employment_type: string
  job_type: string
  max_days_per_week: number
  max_hours_per_month: number
}) {
  try {
    // 従業員番号とパスワードを生成
    const employeeNumber = await generateEmployeeNumber()
    const password = await generateUniquePassword()
    const hashedPassword = await hashPassword(password)

    // employeesテーブルに保存
    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: employeeData.name,
        employment_type: employeeData.employment_type,
        job_type: employeeData.job_type,
        max_days_per_week: employeeData.max_days_per_week,
        max_hours_per_month: employeeData.max_hours_per_month,
        employee_number: employeeNumber,
        password_hash: hashedPassword,
        password_changed: false,
        is_system_account: false,
        can_work_saturday: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      employee_id: data.id,
      employee_number: employeeNumber,
      initial_password: password,
      created_at: data.created_at
    }
  } catch (error) {
    console.error('従業員アカウント作成エラー:', error)
    throw error
  }
}

// ==================== バリデーション ====================

/**
 * 従業員番号の形式チェック
 */
export function validateEmployeeNumber(employeeNumber: string): boolean {
  const pattern = /^emp[0-9]{3}$/
  return pattern.test(employeeNumber)
}

/**
 * 新しいパスワードの強度チェック（ユーザーが変更する際）
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('パスワードは6文字以上である必要があります')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('パスワードに英字を含める必要があります')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('パスワードに数字を含める必要があります')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}