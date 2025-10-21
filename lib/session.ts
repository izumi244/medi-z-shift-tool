import { User } from '@/types'

export interface Session {
  user: User
  expiresAt: string
  createdAt: string
}

const SESSION_KEY = 'shift_tool_session'

// セッション取得
export async function getSession(): Promise<Session | null> {
  try {
    if (typeof window === 'undefined') return null
    
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null
    
    const session: Session = JSON.parse(sessionData)
    
    // セッション有効期限チェック
    if (new Date() > new Date(session.expiresAt)) {
      await clearSession()
      return null
    }
    
    return session
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return null
  }
}

// セッション保存
export async function saveSession(session: Session): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('セッション保存エラー:', error)
    throw error
  }
}

// セッション作成
export async function createSession(user: User, rememberMe: boolean = false): Promise<Session> {
  const now = new Date()
  const expiresAt = new Date()
  
  // remember_me チェックボックスに応じて有効期限設定
  if (rememberMe) {
    expiresAt.setDate(now.getDate() + 14) // 2週間
  } else {
    expiresAt.setHours(now.getHours() + 8) // 8時間
  }
  
  return {
    user,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  }
}

// セッションクリア
export async function clearSession(): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('セッションクリアエラー:', error)
    throw error
  }
}