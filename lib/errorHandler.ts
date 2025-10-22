/**
 * エラーハンドリング関連のユーティリティ
 */

/**
 * アプリケーション独自のエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 未知のエラーをAppErrorに変換
 */
export function toAppError(error: unknown, defaultMessage: string = '予期しないエラーが発生しました'): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error)
  }

  return new AppError(defaultMessage, 'UNKNOWN_ERROR', 500, error)
}

/**
 * エラーをコンソールに記録
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error)
}

/**
 * エラーをコンソールに記録し、AppErrorに変換して返す
 */
export function handleError(context: string, error: unknown, defaultMessage?: string): AppError {
  logError(context, error)
  return toAppError(error, defaultMessage)
}
