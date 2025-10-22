/**
 * 日付フォーマット関連のユーティリティ関数
 */

/**
 * 数値を2桁のゼロパディング文字列に変換
 * @param num - 変換する数値
 * @returns ゼロパディングされた文字列
 * @example padZero(5) // "05"
 */
export function padZero(num: number): string {
  return String(num).padStart(2, '0')
}

/**
 * 年月を YYYY-MM 形式にフォーマット
 * @param year - 年
 * @param month - 月（1-12）
 * @returns YYYY-MM 形式の文字列
 * @example formatYearMonth(2025, 10) // "2025-10"
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${padZero(month)}`
}

/**
 * 年月日を YYYY-MM-DD 形式にフォーマット
 * @param year - 年
 * @param month - 月（1-12）
 * @param day - 日
 * @returns YYYY-MM-DD 形式の文字列
 * @example formatDate(2025, 10, 15) // "2025-10-15"
 */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${padZero(month)}-${padZero(day)}`
}

/**
 * Date オブジェクトを YYYY-MM-DD 形式にフォーマット
 * @param date - Date オブジェクト
 * @returns YYYY-MM-DD 形式の文字列
 * @example formatDateFromDate(new Date(2025, 9, 15)) // "2025-10-15"
 */
export function formatDateFromDate(date: Date): string {
  return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * 現在の年月を YYYY-MM 形式で取得
 * @returns 現在の年月（YYYY-MM形式）
 * @example getCurrentYearMonth() // "2025-10"
 */
export function getCurrentYearMonth(): string {
  const now = new Date()
  return formatYearMonth(now.getFullYear(), now.getMonth() + 1)
}
