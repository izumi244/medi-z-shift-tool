import { User, LoginCredentials, UserRole } from '@/types'

// デモ用のユーザーデータ
const DEMO_USERS: User[] = [
  {
    id: '1',
    user_id: 'admin123',
    employee_number: 'admin123',
    name: '管理者',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'emp002',
    employee_number: 'emp002',
    name: '医療事務スタッフ',
    role: 'employee',
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'devel789',
    employee_number: 'devel789',
    name: '開発者',
    role: 'developer',
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString()
  }
]

// ユーザーID検証
export function validateUserId(userId: string): boolean {
  const pattern = /^[a-z]{5}[0-9]{3}$/
  return pattern.test(userId)
}

// パスワード検証
export function validatePassword(password: string): boolean {
  const pattern = /^[a-z]{5}[0-9]{3}$/
  return pattern.test(password)
}

// 認証情報検証
export async function validateCredentials(credentials: LoginCredentials): Promise<User | null> {
  const { user_id, password } = credentials
  
  // フォーマット検証
  if (!validateUserId(user_id) || !validatePassword(password)) {
    return null
  }

  // デモ用の認証：ユーザーIDとパスワードが同じ場合に認証成功
  if (user_id === password) {
    const user = DEMO_USERS.find(u => u.user_id === user_id)
    if (user) {
      return {
        ...user,
        last_login: new Date().toISOString()
      }
    }
  }

  return null
}