/**
 * 日付ユーティリティ関数
 */

/**
 * 週のキーを取得（月曜日始まり）
 * @param date - 対象の日付
 * @returns 週のキー（月曜日の日付: "YYYY-MM-DD"形式）
 */
export function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay() // 0=日, 1=月, ..., 6=土

  // 月曜日を週の始まりとして計算
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(year, month, day + mondayOffset)

  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}
