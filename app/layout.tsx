import AuthGuard from '@/components/AuthGuard'
import { AuthProvider } from '@/contexts/AuthContext'
import { ShiftDataProvider } from '@/contexts/ShiftDataContext'

import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'シフト管理ツール',
  description: '4名スタッフの勤務管理・記号形式シフト作成ツール',
  keywords: ['シフト管理', '勤務管理', 'スケジュール', 'AI'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AuthProvider>
          <ShiftDataProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ShiftDataProvider>
        </AuthProvider>
      </body>
    </html>
  )
}