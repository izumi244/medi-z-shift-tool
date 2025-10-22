/**
 * バリデーションパターンと関数の定義
 */

// 検証パターン定数
export const VALIDATION_PATTERNS = {
  EMPLOYEE_NUMBER: /^emp[0-9]{3}$/,
  PASSWORD: /^[a-z]{3}[0-9]{3}$/,
} as const

/**
 * 従業員番号の形式検証（emp001形式）
 */
export function validateEmployeeNumber(value: string): boolean {
  return VALIDATION_PATTERNS.EMPLOYEE_NUMBER.test(value)
}

/**
 * パスワードの形式検証（英字3文字+数字3文字）
 */
export function validatePasswordFormat(value: string): boolean {
  return VALIDATION_PATTERNS.PASSWORD.test(value)
}

/**
 * エラーメッセージ定数
 */
export const VALIDATION_MESSAGES = {
  EMPLOYEE_NUMBER_REQUIRED: '従業員番号を入力してください',
  EMPLOYEE_NUMBER_FORMAT: '従業員番号はemp001形式で入力してください',
  PASSWORD_REQUIRED: 'パスワードを入力してください',
  PASSWORD_FORMAT: 'パスワードは英字3文字+数字3文字で入力してください',
} as const
